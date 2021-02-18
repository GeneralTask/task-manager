package main

import (
	"errors"
	"net/http"
	"strings"
	"log"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Gets a user from the database according to an internal token.
func getUserIDFromToken(token string) (primitive.ObjectID, error) {
	db, dbClose := GetDBConnection()
	defer dbClose()

	// Look up a user id according to the InternalAPIToken DB
	var internalToken InternalAPIToken
	err := db.Collection("internal_api_tokens").FindOne(nil, bson.D{{"token", token}}).Decode(&internalToken)

	if err != nil {
		return internalToken.UserID, err
	}

	return internalToken.UserID, nil
}


// Checks an incoming request for a valid token and authenticates based on that
// tokens existence in the database.. An authorization token should be passed in
// a header as
//
//     Authorization: Bearer token
//
// We then set the context's "user_id" for use by other functions. To future
// proof this, we also provide the tokenMiddlewareGetUser and
// tookenMiddlewareGetUserID functions as wrappers around this.
func tokenMiddleware(c *gin.Context) {
	header := c.Request.Header.Get("Authorization")

	// Check that the token exists.
	if header == "" {
		c.AbortWithError(http.StatusUnauthorized, errors.New("Malformed or missing 'Authorization' Header"))
	}

	// Extract the token from Authorization header
	var parsedHeader = strings.Split(header, " ")
	if len(parsedHeader) < 2 || parsedHeader[0] != "Bearer" {
		c.AbortWithError(http.StatusBadRequest, errors.New("Malformed 'Authorization' Header"))
	}

	// Check the token against the databsase
	userId, err := getUserIDFromToken(parsedHeader[1])
	if err != nil {
		// This could occur whenever we can't validate the token, such as if it's
		// expired, etc. In the future we might replace this with something like JWT
		// signing verification.
		c.AbortWithError(http.StatusUnauthorized, errors.New("Authorization token not valid"))
	}

	// Update the context with the UserId
	c.Set("user", userId)
}

// Extract a user id from the context and return it. This is a convenience
// function to allow for future proofing in case our handling of users in
// context changes.
func tokenMiddlewareGetUserID(c *gin.Context) primitive.ObjectID {
	userID, exists := c.Get("user")

	if ! exists {
		log.Fatalf(
			"Attempted to retrieve user information from context but found " +
				"none. Probable cause: attempting to access privileged information " +
				"from a route without token middleware.")
		c.AbortWithStatus(http.StatusInternalServerError)
	}

	// Marshall the generic interface type into an ObjectID
	return userID.(primitive.ObjectID)
}

// Extract a user from the context and return it. This is a convenience function
// to allow for future proofing. In this case it calls tokenMiddlewareGetUserID
// and then looks up the user in the database accordingly.
//
// TODO(Cache this value)
func tokenMiddlewareGetUser(c *gin.Context) User {
	// Open a connection to the database.
	db, dbClose := GetDBConnection()
	defer dbClose()

	// Get the userId from the current context
	userId := tokenMiddlewareGetUserID(c)

	// Retrieve remaining user information
	var user User
	if err := db.Collection("users").FindOne(nil, bson.D{{ "_id", userId}}).Decode(&user); err != nil {
		log.Fatalf("Could not find user associated with id")
		c.AbortWithStatus(http.StatusInternalServerError)
	}

	return user
}
