package api

import (
	"log"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (api *API) EventCreate(c *gin.Context) {
	parentCtx := c.Request.Context()
	sourceID := c.Param("source_id")
	taskSourceResult, err := api.ExternalConfig.GetTaskSourceResult(sourceID)
	if err != nil || !taskSourceResult.Details.IsCreatable {
		Handle404(c)
		return
	}

	// var requestParams EventCreateParams
	var eventCreateObject external.EventCreateObject
	err = c.Bind(&eventCreateObject)
	if err != nil {
		log.Printf("invalid or missing parameter, err: %v", err)
		c.JSON(400, gin.H{"detail": "invalid or missing parameter."})
		return
	}

	db, dbCleanup, err := database.GetDBConnection()
	if err != nil {
		Handle500(c)
		return
	}
	defer dbCleanup()

	userIDRaw, _ := c.Get("user")
	userID := userIDRaw.(primitive.ObjectID)

	_ = db
	_ = userID
	_ = parentCtx

	// update external task
	// err = taskSourceResult.Source.CreateEvent(userID, task.SourceAccountID, task.IDExternal, &modifyParams.TaskChangeableFields)
	err = taskSourceResult.Source.CreateNewEvent(userID, eventCreateObject.AccountID, eventCreateObject)
	if err != nil {
		log.Printf("failed to update external task source: %v", err)
		Handle500(c)
		return
	}
	// UpdateTaskInDB(api, c, taskID, userID, &modifyParams.TaskChangeableFields, task)

	// need some way to map tasksource to task service
	// externalAPICollection := database.GetExternalTokenCollection(db)
	// dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
	// defer cancel()
	// count, err := externalAPICollection.CountDocuments(
	// 	dbCtx,
	// 	bson.M{"$and": []bson.M{
	// 		{"account_id": requestParams.AccountID},
	// 		{"source_id": sourceID},
	// 		{"service_id": TASK_SERVICE_ID_GOOGLE},
	// 		{"user_id": userID},
	// 	}},
	// )
	// if err != nil || count <= 0 {
	// 	c.JSON(404, gin.H{"detail": "account ID not found"})
	// 	return
	// }

	log.Println("jerd")

	// var timeAllocation *int64
	// if requestParams.TimeDuration != nil {
	// 	timeAllocationTemp := (time.Duration(*requestParams.TimeDuration) * time.Second).Nanoseconds()
	// 	timeAllocation = &timeAllocationTemp
	// }
	// taskCreationObject := external.TaskCreationObject{
	// 	Title:          requestParams.Title,
	// 	Body:           requestParams.Body,
	// 	DueDate:        requestParams.DueDate,
	// 	TimeAllocation: timeAllocation,
	// 	IDTaskSection:  IDTaskSection,
	// }
	// err = taskSourceResult.Source.CreateNewTask(userID, requestParams.AccountID, taskCreationObject)
	// if err != nil {
	// 	c.JSON(503, gin.H{"detail": "failed to create task"})
	// 	return
	// }
	c.JSON(200, gin.H{})
}

// func (api *API) EventCreate(c *gin.Context) {
// 	parentCtx := c.Request.Context()
// 	var params SectionParams
// 	err := c.BindJSON(&params)
// 	if err != nil {
// 		log.Printf("error: %v", err)
// 		c.JSON(400, gin.H{"detail": "invalid or missing 'name' parameter."})
// 		return
// 	}

// 	db, dbCleanup, err := database.GetDBConnection()
// 	if err != nil {
// 		Handle500(c)
// 		return
// 	}
// 	defer dbCleanup()
// 	sectionCollection := database.GetTaskSectionCollection(db)

// 	userID, _ := c.Get("user")

// 	dbCtx, cancel := context.WithTimeout(parentCtx, constants.DatabaseTimeout)
// 	defer cancel()
// 	_, err = sectionCollection.InsertOne(
// 		dbCtx,
// 		&database.TaskSection{
// 			UserID: userID.(primitive.ObjectID),
// 			Name:   params.Name,
// 		},
// 	)
// 	if err != nil {
// 		log.Printf("failed to insert section: %+v", err)
// 		Handle500(c)
// 		return
// 	}
// 	c.JSON(201, gin.H{})
// }
