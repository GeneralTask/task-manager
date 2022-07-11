package api

import (
	"github.com/GeneralTask/task-manager/backend/config"
	_ "github.com/GeneralTask/task-manager/backend/docs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func GetRouter(handlers *API) *gin.Engine {
	// Setting release mode has the benefit of reducing spam on the unit test output
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	// Default 404 handler
	router.NoRoute(Handle404)

	// Allow CORS for frontend API requests
	router.Use(CORSMiddleware)

	// Introduce fake lag when running local server to more accurately simulate prod
	router.Use(FakeLagMiddleware)

	// Swagger API (only on local)
	if config.GetEnvironment() == config.Dev {
		router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	// Unauthenticated endpoints
	router.GET("/ping/", handlers.Ping)
	router.GET("/link/:service_name/", handlers.Link)
	router.GET("/link/:service_name/callback/", handlers.LinkCallback)
	router.GET("/login/", handlers.Login)
	router.GET("/login/callback/", handlers.LoginCallback)
	router.POST("/waitlist/", handlers.WaitlistAdd)
	router.POST("/tasks/create_external/slack/", handlers.SlackTaskCreate)

	// logout needs to use the token directly rather than the user so no need to run token middleware
	router.POST("/logout/", handlers.Logout)

	// Unauthenticated endpoints only for dev environment
	router.POST("/create_test_user/", handlers.CreateTestUser)

	// Add middlewares
	router.Use(TokenMiddleware)
	router.Use(LoggingMiddleware)
	// Authenticated endpoints
	router.GET("/meeting_banner/", handlers.MeetingBanner)
	router.GET("/linked_accounts/", handlers.LinkedAccountsList)
	router.GET("/linked_accounts/supported_types/", handlers.SupportedAccountTypesList)
	router.DELETE("/linked_accounts/:account_id/", handlers.DeleteLinkedAccount)
	router.GET("/events/", handlers.EventsList)
	router.POST("/events/create/:source_id/", handlers.EventCreate)
	router.GET("/messages/fetch/", handlers.MessagesFetch)
	router.GET("/messages/v2/", handlers.MessagesListV2)
	router.PATCH("/messages/modify/:message_id/", handlers.MessageModify)
	router.POST("/messages/compose/", handlers.MessageCompose)
	router.GET("/threads/", handlers.ThreadsList)
	router.GET("/threads/detail/:thread_id/", handlers.ThreadDetail)
	router.PATCH("/threads/modify/:thread_id/", handlers.ThreadModify)
	router.POST("/create_task_from_thread/:thread_id/", handlers.CreateTaskFromThread)
	router.GET("/tasks/fetch/", handlers.TasksFetch)
	router.GET("/tasks/v3/", handlers.TasksListV3)
	router.POST("/tasks/create/:source_id/", handlers.TaskCreate)
	router.PATCH("/tasks/modify/:task_id/", handlers.TaskModify)
	router.GET("/tasks/detail/:task_id/", handlers.TaskDetail)
	router.GET("/ping_authed/", handlers.Ping)
	router.GET("/settings/", handlers.SettingsList)
	router.PATCH("/settings/", handlers.SettingsModify)
	router.POST("/log_events/", handlers.LogEventAdd)
	router.POST("/feedback/", handlers.FeedbackAdd)
	router.GET("/user_info/", handlers.UserInfoGet)
	router.PATCH("/user_info/", handlers.UserInfoUpdate)
	router.GET("/sections/", handlers.SectionList)
	router.POST("/sections/create/", handlers.SectionAdd)
	router.PATCH("/sections/modify/:section_id/", handlers.SectionModify)
	router.DELETE("/sections/delete/:section_id/", handlers.SectionDelete)
	router.GET("/overview/views/", handlers.OverviewViewsList)
	router.POST("/overview/views/", handlers.OverviewViewAdd)
	router.PATCH("/overview/views/:view_id", handlers.OverviewViewModify)
	router.GET("/pull_requests/fetch/", handlers.PullRequestsFetch)
	return router
}
