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
	router.GET("/link/:service_name/", handlers.Link)
	router.GET("/link/:service_name/callback/", handlers.LinkCallback)
	router.GET("/login/", handlers.Login)
	router.GET("/login/callback/", handlers.LoginCallback)
	router.POST("/waitlist/", handlers.WaitlistAdd)

	//logout needs to use the token directly rather than the user so no need to run token middleware
	router.POST("/logout/", handlers.Logout)

	router.Use(TokenMiddleware)
	// Authenticated endpoints
	router.GET("/linked_accounts/", handlers.LinkedAccountsList)
	router.GET("/linked_accounts/supported_types/", handlers.SupportedAccountTypesList)
	router.DELETE("/linked_accounts/:account_id/", handlers.DeleteLinkedAccount)
	router.GET("/events/", handlers.EventsList)
	router.GET("/tasks/", handlers.TasksList)
	router.GET("/tasks/v2/", handlers.TasksListV2)
	router.POST("/tasks/create/:source_id/", handlers.TaskCreate)
	router.PATCH("/tasks/modify/:task_id/", handlers.TaskModify)
	router.POST("/tasks/reply/:task_id/", handlers.TaskReply)
	router.GET("/ping/", handlers.Ping)
	router.GET("/settings/", handlers.SettingsList)
	router.PATCH("/settings/", handlers.SettingsModify)
	return router
}
