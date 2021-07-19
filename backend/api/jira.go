package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"reflect"

	"github.com/GeneralTask/task-manager/backend/external"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// JIRARedirectParams ...
type JIRARedirectParams struct {
	Code  string `form:"code"`
	State string `form:"state"`
}

type PriorityID struct {
	ID string `json:"id"`
}

func (api *API) AuthorizeJIRA(c *gin.Context) {
	internalToken, err := getTokenFromCookie(c)
	if err != nil {
		return
	}
	atlassian := external.AtlassianService{Config: api.AtlassianConfigValues}
	authURL, err := atlassian.GetLinkAuthURL(internalToken.UserID)
	if err != nil {
		Handle500(c)
		return
	}
	c.Redirect(302, *authURL)
}

func (api *API) AuthorizeJIRACallback(c *gin.Context) {
	internalToken, err := getTokenFromCookie(c)
	if err != nil {
		return
	}
	// See https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/
	var redirectParams JIRARedirectParams
	if c.ShouldBind(&redirectParams) != nil || redirectParams.Code == "" || redirectParams.State == "" {
		c.JSON(400, gin.H{"detail": "Missing query params"})
		return
	}
	stateTokenID, err := primitive.ObjectIDFromHex(redirectParams.State)
	if err != nil {
		c.JSON(400, gin.H{"detail": "invalid state token format"})
		return
	}
	atlassian := external.AtlassianService{Config: api.AtlassianConfigValues}
	err = atlassian.HandleAuthCallback(redirectParams.Code, stateTokenID, internalToken.UserID)
	if err != nil {
		c.JSON(500, gin.H{"detail": err.Error()})
		return
	}

	c.Redirect(302, config.GetConfigValue("HOME_URL"))
}

func MarkJIRATaskDone(api *API, userID primitive.ObjectID, accountID string, issueID string) error {
	JIRA := external.JIRASource{Atlassian: external.AtlassianService{Config: api.AtlassianConfigValues}}
	token, _ := JIRA.Atlassian.GetToken(userID, accountID)
	siteConfiguration, _ := JIRA.Atlassian.GetSiteConfiguration(userID)
	if token == nil || siteConfiguration == nil {
		return errors.New("missing token or siteConfiguration")
	}

	//first get the list of transitions
	var apiBaseURL string

	if api.AtlassianConfigValues.TransitionURL != nil {
		apiBaseURL = *api.AtlassianConfigValues.TransitionURL
	} else {
		apiBaseURL = JIRA.GetAPIBaseURL(*siteConfiguration)
	}

	finalTransitionID := getFinalTransitionID(apiBaseURL, token.AccessToken, issueID)

	if finalTransitionID == nil {
		return errors.New("final transition not found")
	}

	return executeTransition(apiBaseURL, token.AccessToken, issueID, *finalTransitionID)
}

func getFinalTransitionID(apiBaseURL string, AtlassianAuthToken string, jiraCloudID string) *string {
	transitionsURL := apiBaseURL + "/rest/api/3/issue/" + jiraCloudID + "/transitions"

	req, _ := http.NewRequest("GET", transitionsURL, nil)
	req.Header.Add("Authorization", "Bearer "+AtlassianAuthToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("failed to request transitions: %v", err)
		return nil
	}

	responseString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("failed to read http response body: %v", err)
		return nil
	}

	var data map[string]interface{}
	err = json.Unmarshal(responseString, &data)
	if err != nil {
		log.Printf("failed to parse json data: %v", err)
		return nil
	}

	typeOfArray := reflect.TypeOf(data["transitions"]).String()
	fmt.Println(typeOfArray)
	transitionsArray, castResult := data["transitions"].([]interface{})
	if !castResult || len(transitionsArray) < 1 {
		return nil
	}
	lastTransition, castResult := transitionsArray[len(transitionsArray)-1].(map[string]interface{})
	if !castResult {
		return nil
	}
	transitionID := lastTransition["id"]
	typedTransitionID, castResult := transitionID.(string)
	if !castResult {
		return nil
	}
	return &typedTransitionID
}

func executeTransition(apiBaseURL string, AtlassianAuthToken string, issueID string, newTransitionID string) error {
	transitionsURL := apiBaseURL + "/rest/api/3/issue/" + issueID + "/transitions"
	params := []byte(`{"transition": {"id": "` + newTransitionID + `"}}`)
	req, _ := http.NewRequest("POST", transitionsURL, bytes.NewBuffer(params))
	req.Header.Add("Authorization", "Bearer "+AtlassianAuthToken)
	req.Header.Add("Content-Type", "application/json")

	_, err := http.DefaultClient.Do(req)
	return err
}
