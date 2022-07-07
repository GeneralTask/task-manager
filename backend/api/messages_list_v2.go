package api

import (
	"context"
	"sort"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/settings"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

const DEFAULT_MESSAGE_LIMIT int = 100

type messagesListParams struct {
	database.Pagination `form:",inline" json:",inline"`
	OnlyUnread          *bool `form:"only_unread" json:"only_unread"`
}

func (api *API) MessagesListV2(c *gin.Context) {
	parentCtx := c.Request.Context()
	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	userID, _ := c.Get("user")
	var userObject database.User
	userCollection := database.GetUserCollection(db)
	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	err = userCollection.FindOne(dbCtx, bson.M{"_id": userID}).Decode(&userObject)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}

	var params messagesListParams
	err = c.Bind(&params)
	if err != nil {
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}
	onlyUnread := false
	if params.OnlyUnread != nil && *params.OnlyUnread {
		onlyUnread = true
	}
	if !database.IsValidPagination(params.Pagination) {
		limit := DEFAULT_MESSAGE_LIMIT
		page := 1
		params.Pagination = database.Pagination{Limit: &limit, Page: &page}
	}

	emails, err := database.GetEmails(db, userID.(primitive.ObjectID), onlyUnread, params.Pagination)
	if err != nil {
		Handle500(c)
		return
	}

	orderedMessages, err := api.orderMessagesV2(
		db,
		emails,
		userID.(primitive.ObjectID),
	)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, orderedMessages)
}

func (api *API) orderMessagesV2(
	db *mongo.Database,
	fetchedEmails *[]database.Item,
	userID primitive.ObjectID,
) ([]*message, error) {
	orderingSetting, err := settings.GetUserSetting(db, userID, settings.SettingFieldEmailOrderingPreference)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch email ordering setting")
		return []*message{}, err
	}
	newestEmailsFirst := *orderingSetting == settings.ChoiceKeyNewestFirst
	sort.SliceStable(*fetchedEmails, func(i, j int) bool {
		a := (*fetchedEmails)[i]
		b := (*fetchedEmails)[j]
		if newestEmailsFirst {
			return a.TaskBase.CreatedAtExternal > b.TaskBase.CreatedAtExternal
		} else {
			return a.TaskBase.CreatedAtExternal < b.TaskBase.CreatedAtExternal
		}
	})

	var messages []*message
	for _, email := range *fetchedEmails {
		messages = append(messages, api.emailToMessage(&email))
	}
	return messages, nil
}
