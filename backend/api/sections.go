package api

import (
	"context"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type SectionParams struct {
	Name string `json:"name" binding:"required"`
}

type SectionResult struct {
	ID   primitive.ObjectID `json:"id"`
	Name string             `json:"name"`
}

func (api *API) SectionList(c *gin.Context) {
	userID, _ := c.Get("user")

	sections, err := database.GetTaskSections(api.DB, userID.(primitive.ObjectID))
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch sections for user")
		Handle500(c)
		return
	}
	sectionResults := []SectionResult{}
	for _, section := range *sections {
		sectionResults = append(sectionResults, SectionResult{
			ID:   section.ID,
			Name: section.Name,
		})
	}
	c.JSON(200, sectionResults)
}

func (api *API) SectionAdd(c *gin.Context) {
	parentCtx := c.Request.Context()
	var params SectionParams
	err := c.BindJSON(&params)
	if err != nil {
		api.Logger.Error().Err(err).Msg("error")
		c.JSON(400, gin.H{"detail": "invalid or missing 'name' parameter."})
		return
	}

	sectionCollection := database.GetTaskSectionCollection(api.DB)

	userID, _ := c.Get("user")

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	_, err = sectionCollection.InsertOne(
		dbCtx,
		&database.TaskSection{
			UserID: userID.(primitive.ObjectID),
			Name:   params.Name,
		},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to insert section")
		Handle500(c)
		return
	}
	c.JSON(201, gin.H{})
}

func (api *API) SectionModify(c *gin.Context) {
	sectionIDHex := c.Param("section_id")
	sectionID, err := primitive.ObjectIDFromHex(sectionIDHex)
	if err != nil {
		// This means the section ID is improperly formatted
		Handle404(c)
		return
	}
	parentCtx := c.Request.Context()
	var params SectionParams
	err = c.BindJSON(&params)
	if err != nil {
		api.Logger.Error().Err(err).Msg("error")
		c.JSON(400, gin.H{"detail": "invalid or missing 'name' parameter."})
		return
	}
	if sectionID == constants.IDTaskSectionDefault {
		api.setDefaultSectionName(c, parentCtx, params.Name)
		return
	}

	sectionCollection := database.GetTaskSectionCollection(api.DB)

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	res, err := sectionCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": sectionID},
			{"user_id": userID},
		}},
		bson.M{"$set": bson.M{"name": params.Name}},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update internal DB")
		Handle500(c)
		return
	}
	if res.MatchedCount != 1 {
		api.Logger.Error().Msgf("failed to update section %+v", res)
		Handle404(c)
		return
	}
	c.JSON(200, gin.H{})
}

func (api *API) setDefaultSectionName(c *gin.Context, ctx context.Context, name string) {
	settingsCollection := database.GetDefaultSectionSettingsCollection(api.DB)

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	dbCtx, cancel := context.WithTimeout(ctx, constants.DatabaseTimeout)
	defer cancel()

	_, err := settingsCollection.UpdateOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"user_id": userID},
		}},
		bson.M{"$set": bson.M{"name_override": name}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to set default task section name")
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
	return

}

func (api *API) SectionDelete(c *gin.Context) {
	sectionIDHex := c.Param("section_id")
	sectionID, err := primitive.ObjectIDFromHex(sectionIDHex)
	if err != nil {
		// This means the section ID is improperly formatted
		Handle404(c)
		return
	}
	parentCtx := c.Request.Context()
	sectionCollection := database.GetTaskSectionCollection(api.DB)

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	defer cancel()
	res, err := sectionCollection.DeleteOne(
		dbCtx,
		bson.M{"$and": []bson.M{
			{"_id": sectionID},
			{"user_id": userID},
		}},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update internal DB")
		Handle500(c)
		return
	}
	if res.DeletedCount != 1 {
		api.Logger.Error().Msgf("failed to delete section %+v", res)
		Handle404(c)
		return
	}
	c.JSON(200, gin.H{})
}
