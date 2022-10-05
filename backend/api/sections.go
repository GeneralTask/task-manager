package api

import (
	"context"
	"sort"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SectionCreateParams struct {
	Name string `json:"name" binding:"required"`
}

type SectionModifyParams struct {
	IDOrdering int    `json:"id_ordering"`
	Name       string `json:"name"`
}

type SectionResult struct {
	ID         primitive.ObjectID `json:"id"`
	IDOrdering int                `json:"id_ordering"`
	Name       string             `json:"name"`
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
			ID:         section.ID,
			IDOrdering: section.IDOrdering,
			Name:       section.Name,
		})
	}
	sort.SliceStable(sectionResults, func(i, j int) bool {
		// preserve existing sort if no ordering ID set
		if sectionResults[i].IDOrdering == 0 && sectionResults[j].IDOrdering == 0 {
			return sectionResults[i].ID.Hex() < sectionResults[j].ID.Hex()
		}
		return sectionResults[i].IDOrdering < sectionResults[j].IDOrdering
	})
	c.JSON(200, sectionResults)
}

func (api *API) SectionAdd(c *gin.Context) {
	var params SectionCreateParams
	err := c.BindJSON(&params)
	if err != nil {
		api.Logger.Error().Err(err).Msg("error")
		c.JSON(400, gin.H{"detail": "invalid or missing 'name' parameter"})
		return
	}

	sectionCollection := database.GetTaskSectionCollection(api.DB)

	userID, _ := c.Get("user")

	_, err = sectionCollection.InsertOne(
		context.Background(),
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
	var params SectionModifyParams
	err = c.BindJSON(&params)
	if err != nil || (params.Name == "" && params.IDOrdering == 0) {
		api.Logger.Error().Err(err).Msg("error")
		c.JSON(400, gin.H{"detail": "invalid or missing task section modify parameter"})
		return
	}

	sectionCollection := database.GetTaskSectionCollection(api.DB)

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	updateFields := bson.M{}
	if params.Name != "" {
		updateFields["name"] = params.Name
	}
	if params.IDOrdering != 0 {
		updateFields["id_ordering"] = params.IDOrdering
	}
	res, err := sectionCollection.UpdateOne(
		context.Background(),
		bson.M{"$and": []bson.M{
			{"_id": sectionID},
			{"user_id": userID},
		}},
		bson.M{"$set": updateFields},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update section")
		Handle500(c)
		return
	}
	if res.MatchedCount != 1 {
		api.Logger.Error().Msgf("failed to update section %+v", res)
		Handle404(c)
		return
	}
	if params.IDOrdering != 0 {
		err = database.AdjustOrderingIDsForCollection(sectionCollection, userID, sectionID, params.IDOrdering)
		if err != nil {
			Handle500(c)
			return
		}
	}
	c.JSON(200, gin.H{})
}

func (api *API) SectionDelete(c *gin.Context) {
	sectionIDHex := c.Param("section_id")
	sectionID, err := primitive.ObjectIDFromHex(sectionIDHex)
	if err != nil {
		// This means the section ID is improperly formatted
		Handle404(c)
		return
	}
	sectionCollection := database.GetTaskSectionCollection(api.DB)

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	res, err := sectionCollection.DeleteOne(
		context.Background(),
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
