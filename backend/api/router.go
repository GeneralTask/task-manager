package api

import "github.com/gin-gonic/gin"

func GetRouter(handlers *API) *gin.Engine {
	// Setting release mode has the benefit of reducing spam on the unit test output
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	// Default 404 handler
	router.NoRoute(Handle404)

	// Allow CORS for frontend API requests
	router.Use(CORSMiddleware)

	// Unauthenticated endpoints
	router.GET("/authorize/jira/", handlers.AuthorizeJIRA)
	router.GET("/authorize/jira/callback/", handlers.AuthorizeJIRACallback)
	router.GET("/login/", handlers.Login)
	router.GET("/login/callback/", handlers.LoginCallback)
	router.GET("/authorize/slack/", handlers.AuthorizeSlack)
	router.GET("/authorize/slack/callback/", handlers.AuthorizeSlackCallback)
	router.POST("/waitlist/", handlers.WaitlistAdd)

	//logout needs to use the token directly rather than the user so no need to run token middleware
	router.POST("/logout/", handlers.Logout)

	router.Use(TokenMiddleware)
	// Authenticated endpoints
	router.GET("/connected_accounts/supported_types/", handlers.SupportedAccountTypesList)
	router.GET("/tasks/", handlers.TasksList)
	router.PATCH("/tasks/:task_id/", handlers.TaskModify)
	router.POST("/tasks/:task_id/reply/", handlers.TaskReply)
	router.GET("/ping/", handlers.Ping)
	router.GET("/settings/", handlers.SettingsList)
	router.PATCH("/settings/", handlers.SettingsModify)
	return router
}
