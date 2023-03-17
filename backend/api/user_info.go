package api

import (
	"context"
	"strings"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

type UserInfo struct {
	AgreedToTerms       bool   `json:"agreed_to_terms"`
	OptedIntoMarketing  bool   `json:"opted_into_marketing"`
	BusinessModeEnabled bool   `json:"business_mode_enabled"`
	Name                string `json:"name"`
	IsEmployee          bool   `json:"is_employee"`
	Email               string `json:"email"`
	IsCompanyEmail      bool   `json:"is_company_email"`
	LinearName          string `json:"linear_name,omitempty"`
	LinearDisplayName   string `json:"linear_display_name,omitempty"`
}

type UserInfoParams struct {
	AgreedToTerms      *bool `json:"agreed_to_terms" bson:"agreed_to_terms,omitempty"`
	OptedIntoMarketing *bool `json:"opted_into_marketing" bson:"opted_into_marketing,omitempty"`
}

func (api *API) UserInfoGet(c *gin.Context) {
	userID, _ := c.Get("user")
	var userObject database.User
	userCollection := database.GetUserCollection(api.DB)
	err := userCollection.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&userObject)

	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user")
		Handle500(c)
		return
	}
	c.JSON(200, UserInfo{
		AgreedToTerms:       userObject.AgreedToTerms != nil && *userObject.AgreedToTerms,
		OptedIntoMarketing:  userObject.OptedIntoMarketing != nil && *userObject.OptedIntoMarketing,
		BusinessModeEnabled: userObject.BusinessModeEnabled != nil && *userObject.BusinessModeEnabled,
		Name:                userObject.Name,
		IsEmployee:          strings.HasSuffix(strings.ToLower(userObject.Email), "@generaltask.com"),
		Email:               userObject.Email,
		IsCompanyEmail:      isCompanyEmail(userObject.Email),
		LinearName:          userObject.LinearName,
		LinearDisplayName:   userObject.LinearDisplayName,
	})
}

func isCompanyEmail(email string) bool {
	domain, err := database.GetEmailDomain(email)
	if err != nil {
		// error state is false (i.e. we assume the email address is open)
		return false
	}
	return !utils.IsOpenEmailAddress(domain)
}

func (api *API) UserInfoUpdate(c *gin.Context) {
	var params UserInfoParams
	err := c.BindJSON(&params)
	if err != nil {
		api.Logger.Error().Err(err).Msg("error")
		c.JSON(400, gin.H{"detail": "invalid or missing parameters."})
		return
	}

	userID, _ := c.Get("user")
	userCollection := database.GetUserCollection(api.DB)
	_, err = userCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": userID},
		bson.M{"$set": params},
	)
	if err != nil {
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
}
