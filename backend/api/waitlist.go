package api

import (
	"context"
	"log"
	"regexp"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
)

type WaitlistParams struct {
	Email string `json:"email"`
}

func (api *API) WaitlistAdd(c *gin.Context) {
	var params WaitlistParams
	err := c.BindJSON(&params)
	if err != nil || params.Email == "" {
		log.Println("err:", err)
		c.JSON(400, gin.H{"detail": "Invalid or missing 'email' parameter."})
		return
	}
	if !isEmailValid(params.Email) {
		c.JSON(400, gin.H{"detail": "Invalid email format."})
		return
	}

	db, dbCleanup := database.GetDBConnection()
	defer dbCleanup()
	waitlistCollection := db.Collection("waitlist")
	_, err = waitlistCollection.InsertOne(context.TODO(), &database.WaitlistEntry{Email: params.Email})
	if err != nil {
		log.Fatalf("Failed to insert waitlist entry: %v", err)
	}
	c.JSON(200, gin.H{})
}

// Email validation taken from https://golangcode.com/validate-an-email-address/
var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

// isEmailValid checks if the email provided passes the required structure and length.
func isEmailValid(e string) bool {
	if len(e) < 3 && len(e) > 254 {
		return false
	}
	return emailRegex.MatchString(e)
}
