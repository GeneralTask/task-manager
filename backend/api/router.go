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

	// Kick off logging of request
	router.Use(LogRequestMiddleware(handlers.DB))

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

	router.POST("/linear/webhook/", handlers.LinearWebhook)

	// Slack App (Workspace level) endpoint for oauth verification
	// We need this as we don't actually use the token provided, but still need to access it to
	// successfully install our app in a new Workspace
	router.GET("/link_app/slack/", handlers.LinkSlackApp)

	// logout needs to use the token directly rather than the user so no need to run token middleware
	router.POST("/logout/", handlers.Logout)

	// The note detail endpoint is specifically unauthenticated for shareable notes
	// only notes with is_shared=true can be shared
	router.GET("/notes/detail/:note_id/", handlers.NoteDetails)
	router.GET("/note/:note_id/", handlers.NotePreview)

	// Unauthenticated endpoints only for dev environment
	router.POST("/create_test_user/", handlers.CreateTestUser)

	// Add middlewares
	router.Use(TokenMiddleware(handlers.DB))
	router.Use(LoggingMiddleware(handlers.DB))
	// Authenticated endpoints
	router.GET("/meeting_banner/", handlers.MeetingBanner)

	router.GET("/linked_accounts/", handlers.LinkedAccountsList)
	router.GET("/linked_accounts/supported_types/", handlers.SupportedAccountTypesList)
	router.DELETE("/linked_accounts/:account_id/", handlers.DeleteLinkedAccount)

	router.GET("/calendars/", handlers.CalendarsList)
	router.GET("/events/", handlers.EventsList)
	router.POST("/events/create/:source_id/", handlers.EventCreate)
	router.GET("/events/:event_id/", handlers.EventDetail)
	router.DELETE("/events/delete/:event_id/", handlers.EventDelete)
	router.PATCH("/events/modify/:event_id/", handlers.EventModify)
	router.GET("/shareable_tasks/detail/:task_id/", handlers.ShareableTaskDetails)

	router.GET("/tasks/fetch/", handlers.TasksFetch)
	router.GET("/tasks/v3/", handlers.TasksListV3)
	router.GET("/tasks/v4/", handlers.TasksListV4)
	router.POST("/tasks/create/:source_id/", handlers.TaskCreate)
	router.PATCH("/tasks/modify/:task_id/", handlers.TaskModify)
	router.GET("/tasks/detail/:task_id/", handlers.TaskDetail)
	router.POST("/tasks/:task_id/comments/add/", handlers.TaskAddComment)

	router.GET("/recurring_task_templates/", handlers.RecurringTaskTemplateList)
	router.GET("/recurring_task_templates/v2/", handlers.RecurringTaskTemplateListV2)
	router.GET("/recurring_task_templates/backfill_tasks/", handlers.RecurringTaskTemplateBackfillTasks)
	router.POST("/recurring_task_templates/create/", handlers.RecurringTaskTemplateCreate)
	router.PATCH("/recurring_task_templates/modify/:template_id/", handlers.RecurringTaskTemplateModify)

	router.GET("/notes/", handlers.NotesList)
	router.PATCH("/notes/modify/:note_id/", handlers.NoteModify)
	router.POST("/notes/create/", handlers.NoteCreate)

	router.GET("/ping_authed/", handlers.Ping)

	router.GET("/settings/", handlers.SettingsList)
	router.PATCH("/settings/", handlers.SettingsModify)

	router.POST("/log_events/", handlers.LogEventAdd)
	router.POST("/feedback/", handlers.FeedbackAdd)

	router.GET("/user_info/", handlers.UserInfoGet)
	router.PATCH("/user_info/", handlers.UserInfoUpdate)

	router.GET("/sections/", handlers.SectionList)
	router.GET("/sections/v2/", handlers.SectionListV2)
	router.POST("/sections/create/", handlers.SectionAdd)
	router.PATCH("/sections/modify/:section_id/", handlers.SectionModify)
	router.DELETE("/sections/delete/:section_id/", handlers.SectionDelete)

	// Currently frontend is using endpoint with trailing slash, so we need to support both
	router.GET("/overview/views", handlers.OverviewViewsList)
	router.GET("/overview/views/", handlers.OverviewViewsList)

	router.GET("/meeting_preparation_tasks/", handlers.MeetingPreparationTasksList)

	router.POST("/overview/views/", handlers.OverviewViewAdd)
	router.PATCH("/overview/views/bulk_modify/", handlers.OverviewViewBulkModify)
	router.PATCH("/overview/views/:view_id/", handlers.OverviewViewModify)
	router.DELETE("/overview/views/:view_id/", handlers.OverviewViewDelete)
	router.GET("/overview/supported_views/", handlers.OverviewSupportedViewsList)
	router.GET("/overview/views/suggestion/", handlers.OverviewViewsSuggestion)
	router.GET("/overview/views/suggestions_remaining/", handlers.OverviewViewsSuggestionsRemaining)

	router.GET("/pull_requests/", handlers.PullRequestsList)
	router.GET("/pull_requests/fetch/", handlers.PullRequestsFetch)

	// Add business middleware. Endpoints below this require business mode to be enabled
	router.Use(BusinessMiddleware(handlers.DB))
	router.GET("/dashbaord/data/", handlers.DashboardData)
	router.GET("/ping_business/", handlers.Ping)

	return router
}
