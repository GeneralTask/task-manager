package main

import (
	"github.com/GeneralTask/task-manager/backend/api"

	"github.com/gin-gonic/gin"
)

func getRouter(handlers *api.API) *gin.Engine {
	// Setting release mode has the benefit of reducing spam on the unit test output
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	// Default 404 handler
	router.NoRoute(api.handle404)

	// Allow CORS for frontend API requests
	router.Use(api.CORSMiddleware)

	// Unauthenticated endpoints
	router.GET("/authorize/jira/", handlers.authorizeJIRA)
	router.GET("/authorize/jira/callback/", handlers.authorizeJIRACallback)
	router.GET("/login/", handlers.login)
	router.GET("/login/callback/", handlers.loginCallback)

	//logout needs to use the token directly rather than the user so no need to run token middleware
	router.POST("/logout/", handlers.logout)

	router.Use(tokenMiddleware)
	// Authenticated endpoints
	router.GET("/tasks/", handlers.tasksList)
	router.PATCH("/tasks/:task_id/", handlers.taskModify)
	router.GET("/ping/", handlers.ping)
	return router
}

func main() {
	getRouter(&API{GoogleConfig: getGoogleConfig()}).Run()
}
