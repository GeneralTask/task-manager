package main

import (
	"github.com/GeneralTask/task-manager/api"

	"github.com/gin-gonic/gin"
)

func getRouter(api *api.API) *gin.Engine {
	// Setting release mode has the benefit of reducing spam on the unit test output
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	// Default 404 handler
	router.NoRoute(handle404)

	// Allow CORS for frontend API requests
	router.Use(CORSMiddleware)

	// Unauthenticated endpoints
	router.GET("/authorize/jira/", api.authorizeJIRA)
	router.GET("/authorize/jira/callback/", api.authorizeJIRACallback)
	router.GET("/login/", api.login)
	router.GET("/login/callback/", api.loginCallback)

	//logout needs to use the token directly rather than the user so no need to run token middleware
	router.POST("/logout/", api.logout)

	router.Use(tokenMiddleware)
	// Authenticated endpoints
	router.GET("/tasks/", api.tasksList)
	router.PATCH("/tasks/:task_id/", api.taskModify)
	router.GET("/ping/", api.ping)
	return router
}

func main() {
	getRouter(&API{GoogleConfig: getGoogleConfig()}).Run()
}
