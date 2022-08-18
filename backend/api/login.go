package api

import (
	"context"
	"fmt"
	"strings"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	guuid "github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// GoogleRedirectParams ...
type GoogleRedirectParams struct {
	State string `form:"state"`
	Code  string `form:"code"`
	Scope string `form:"scope"`
}

type LoginRedirectParams struct {
	ForcePrompt bool `form:"force_prompt"`
	UseDeeplink bool `form:"use_deeplink"`
}

// Login godoc
// @Summary      Begins General Task login process
// @Description  Required for getting authToken to use authenticated endpoints
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        force_prompt   	query     string  false "should use prompt"
// @Param        use_deeplink   	query     string  false "should use deeplink"
// @Success      302 {object} string "URL redirect"
// @Failure      500 {object} string "internal server error"
// @Router       /login/ [get]
func (api *API) Login(c *gin.Context) {
	var params LoginRedirectParams
	forcePrompt := c.ShouldBind(&params) == nil && params.ForcePrompt
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()
	insertedStateToken, err := database.CreateStateToken(db, nil, params.UseDeeplink)
	if err != nil {
		Handle500(c)
		return
	}
	stateTokenID, err := primitive.ObjectIDFromHex(*insertedStateToken)
	if err != nil {
		Handle500(c)
		return
	}
	googleService := external.GoogleService{
		LoginConfig:  api.ExternalConfig.GoogleLoginConfig,
		LinkConfig:   api.ExternalConfig.GoogleAuthorizeConfig,
		OverrideURLs: api.ExternalConfig.GoogleOverrideURLs,
	}
	authURL, err := googleService.GetSignupURL(stateTokenID, forcePrompt)
	if err != nil {
		Handle500(c)
		return
	}
	c.SetCookie("loginStateToken", *insertedStateToken, constants.DAY, "/", config.GetConfigValue("COOKIE_DOMAIN"), false, false)
	c.Redirect(302, *authURL)
}

// LoginCallback godoc
// @Summary      Begins General Task login process
// @Description  Finished the logging in process
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        code   	query     string  true "OAuth Code"
// @Param        state   	query     string  true "OAuth State"
// @Param        scope   	query     string  true "OAuth Scope"
// @Success      302 {object} string "URL redirect"
// @Failure      400 {object} string "invalid params"
// @Failure      403 {object} string "user not approved for use"
// @Failure      500 {object} string "internal server error"
// @Router       /login/callback/ [get]
func (api *API) LoginCallback(c *gin.Context) {
	parentCtx := c.Request.Context()
	var redirectParams GoogleRedirectParams
	if c.ShouldBind(&redirectParams) != nil || redirectParams.State == "" || redirectParams.Code == "" || redirectParams.Scope == "" {
		c.JSON(400, gin.H{"detail": "missing query params"})
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	useDeeplinkRedirect := false
	if !api.SkipStateTokenCheck {
		stateTokenID, err := primitive.ObjectIDFromHex(redirectParams.State)
		if err != nil {
			c.JSON(400, gin.H{"detail": "invalid state token format"})
			return
		}
		stateTokenFromCookie, _ := c.Cookie("loginStateToken")
		stateTokenIDFromCookie, err := primitive.ObjectIDFromHex(stateTokenFromCookie)
		if err != nil {
			c.JSON(400, gin.H{"detail": "invalid state token cookie format"})
			return
		}
		if stateTokenID != stateTokenIDFromCookie {
			c.JSON(400, gin.H{"detail": "state token does not match cookie"})
			return
		}
		token, err := database.GetStateToken(db, stateTokenID, nil)
		if err != nil {
			c.JSON(400, gin.H{"detail": "invalid state token"})
			return
		}
		useDeeplinkRedirect = token.UseDeeplink
		err = database.DeleteStateToken(db, stateTokenID, nil)
		if err != nil {
			c.JSON(400, gin.H{"detail": "invalid state token"})
			return
		}
	}

	googleService := external.GoogleService{
		LoginConfig:  api.ExternalConfig.GoogleLoginConfig,
		LinkConfig:   api.ExternalConfig.GoogleAuthorizeConfig,
		OverrideURLs: api.ExternalConfig.GoogleOverrideURLs,
	}
	userID, userIsNew, email, err := googleService.HandleSignupCallback(external.CallbackParams{Oauth2Code: &redirectParams.Code})
	if err != nil {
		api.Logger.Error().Err(err).Msg("Failed to handle signup")
		Handle500(c)
		return
	}

	if userIsNew != nil && *userIsNew {
		err = createNewUserTasks(parentCtx, userID, db)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to create starter tasks")
		}
		err = createNewUserViews(parentCtx, userID, db)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to create starter views")
		}
	}

	lowerEmail := strings.ToLower(*email)
	waitlistCollection := database.GetWaitlistCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	count, err := waitlistCollection.CountDocuments(
		dbCtx,
		bson.M{"$and": []bson.M{{"email": lowerEmail}, {"has_access": true}}},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to query waitlist")
		Handle500(c)
		return
	}
	isGTUser := strings.HasSuffix(lowerEmail, "@generaltask.com")
	if _, contains := constants.ALLOWED_USERNAMES[lowerEmail]; !contains && !isGTUser && count == 0 {
		c.JSON(403, gin.H{"detail": "email has not been approved."})
		return
	}

	internalToken := guuid.New().String()
	internalAPITokenCollection := database.GetInternalTokenCollection(db)
	dbCtx, cancel = context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = internalAPITokenCollection.InsertOne(
		dbCtx,
		&database.InternalAPIToken{UserID: userID, Token: internalToken},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to create internal token record")
		Handle500(c)
		return
	}

	if useDeeplinkRedirect {
		c.Redirect(302, fmt.Sprintf(constants.DeeplinkAuthentication, internalToken))
	} else {
		c.SetCookie("authToken", internalToken, constants.MONTH, "/", config.GetConfigValue("COOKIE_DOMAIN"), false, false)
		c.Redirect(302, config.GetConfigValue("HOME_URL"))
	}
}

func createNewUserTasks(parentCtx context.Context, userID primitive.ObjectID, db *mongo.Database) error {
	taskCollection := database.GetTaskCollection(db)
	for index, title := range constants.StarterTasks {
		newTask := database.Item{
			TaskBase: database.TaskBase{
				UserID:          userID,
				IDExternal:      primitive.NewObjectID().Hex(),
				IDOrdering:      index + 1,
				IDTaskSection:   constants.IDTaskSectionDefault,
				SourceID:        external.TASK_SOURCE_ID_GT_TASK,
				Title:           title,
				Body:            "",
				SourceAccountID: external.GeneralTaskDefaultAccountID,
			},
			TaskType: database.TaskType{IsTask: true},
		}
		dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
		defer cancel()
		_, err := taskCollection.InsertOne(dbCtx, newTask)
		if err != nil {
			return err
		}
	}
	return nil
}

func createNewUserViews(parentCtx context.Context, userID primitive.ObjectID, db *mongo.Database) error {
	viewCollection := database.GetViewCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()

	for index, view := range constants.StarterViews {
		newView := database.View{
			ID:            primitive.NewObjectID(),
			UserID:        userID,
			IDOrdering:    index + 1,
			Type:          view.Type,
			IsReorderable: view.IsReorderable,
			IsLinked:      view.IsLinked,
			TaskSectionID: view.TaskSectionID,
		}
		_, err := viewCollection.InsertOne(dbCtx, newView)

		if err != nil {
			return err
		}
	}
	return nil
}
