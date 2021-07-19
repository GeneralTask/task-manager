package external

import (
	"context"
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"

	"github.com/GeneralTask/task-manager/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type JIRASource struct {
	Atlassian AtlassianService
}

func (JIRA JIRASource) GetListOfPriorities(jiraConfig JIRAConfig, userID primitive.ObjectID, authToken string) error {
	var baseURL string
	if jiraConfig.PriorityListURL != nil {
		baseURL = *jiraConfig.PriorityListURL
	} else if siteConfiguration, _ := JIRA.Atlassian.GetSiteConfiguration(userID); siteConfiguration != nil {
		baseURL = JIRA.GetAPIBaseURL(*siteConfiguration)
	} else {
		return errors.New("could not form base url")
	}

	url := baseURL + "/rest/api/3/priority/"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", "Bearer "+authToken)
	req.Header.Add("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)

	if err != nil {
		return err
	}
	priorityListString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	var priorityIds []PriorityID
	err = json.Unmarshal(priorityListString, &priorityIds)

	if err != nil {
		return err
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		return err
	}
	defer dbCleanup()

	prioritiesCollection := db.Collection("jira_priorities")
	_, err = prioritiesCollection.DeleteMany(context.TODO(), bson.M{"user_id": userID})
	if err != nil {
		return err
	}

	var jiraPriorities []interface{}
	for index, object := range priorityIds {
		jiraPriorities = append(jiraPriorities, database.JIRAPriority{
			UserID:          userID,
			JIRAID:          object.ID,
			IntegerPriority: index + 1,
		})
	}
	_, err = prioritiesCollection.InsertMany(context.TODO(), jiraPriorities)
	return err
}

func (JIRA JIRASource) GetAPIBaseURL(siteConfiguration database.AtlassianSiteConfiguration) string {
	return "https://api.atlassian.com/ex/jira/" + siteConfiguration.CloudID
}
