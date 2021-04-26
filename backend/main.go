package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"

	"github.com/gin-gonic/gin"
	guuid "github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"
)

// GoogleRedirectParams ...
type GoogleRedirectParams struct {
	State string `form:"state"`
	Code  string `form:"code"`
	Scope string `form:"scope"`
}

// GoogleUserInfo ...
type GoogleUserInfo struct {
	SUB   string `json:"sub"`
	EMAIL string `json:"email"`
}

// JIRAAuthToken ...
type JIRAAuthToken struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// JIRAConfig ...
type JIRAConfig struct {
	APIBaseURL *string
	CloudIDURL *string
	TokenURL   *string
}

// JIRARedirectParams ...
type JIRARedirectParams struct {
	Code string `form:"code"`
}

// JIRASite ...
type JIRASite struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	URL       string   `json:"url"`
	Scopes    []string `json:"scopes"`
	AvatarURL string   `json:"avatarUrl`
}

// JIRATask represents the API detail result for issues - only fields we need
type JIRATask struct {
	Fields JIRATaskFields `json:"fields"`
	ID     string         `json:"id"`
	Key    string         `json:"key"`
}

// JIRATaskFields ...
type JIRATaskFields struct {
	DueDate string `json:"duedate"`
	Summary string `json:"summary"`
}

// JIRATaskList represents the API list result for issues - only fields we need
type JIRATaskList struct {
	Issues []JIRATask `json:"issues"`
}

// HTTPClient ...
type HTTPClient interface {
	Get(url string) (*http.Response, error)
}

type oauthConfigWrapper struct {
	Config *oauth2.Config
}

func (c *oauthConfigWrapper) AuthCodeURL(state string, opts ...oauth2.AuthCodeOption) string {
	return c.Config.AuthCodeURL(state, opts...)
}

func (c *oauthConfigWrapper) Exchange(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return c.Config.Exchange(ctx, code, opts...)
}

func (c *oauthConfigWrapper) Client(ctx context.Context, t *oauth2.Token) HTTPClient {
	return c.Config.Client(ctx, t)
}

// OauthConfigWrapper is the interface for interacting with the oauth2 config
type OauthConfigWrapper interface {
	AuthCodeURL(state string, opts ...oauth2.AuthCodeOption) string
	Client(ctx context.Context, t *oauth2.Token) HTTPClient
	Exchange(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error)
}

// API is the object containing API route handlers
type API struct {
	GoogleConfig     OauthConfigWrapper
	JIRAConfigValues JIRAConfig
}

func getGoogleConfig() OauthConfigWrapper {
	// Taken from https://developers.google.com/people/quickstart/go
	b, err := ioutil.ReadFile("credentials.json")
	if err != nil {
		log.Fatalf("Unable to read credentials file: %v", err)
	}
	config, err := google.ConfigFromJSON(b, "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.events")
	if err != nil {
		log.Fatalf("Unable to parse credentials file to config: %v", err)
	}
	config.RedirectURL = GetConfigValue("GOOGLE_OAUTH_REDIRECT_URL")
	return &oauthConfigWrapper{Config: config}
}

var ALLOWED_USERNAMES = map[string]struct{}{
	"jasonscharff@gmail.com":  struct{}{},
	"jreinstra@gmail.com":     struct{}{},
	"john@robinhood.com":      struct{}{},
	"scottmai702@gmail.com":   struct{}{},
	"sequoia@sequoiasnow.com": struct{}{},
	"nolan1299@gmail.com":     struct{}{},
}

func (api *API) authorizeJIRA(c *gin.Context) {
	authURL := "https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=7sW3nPubP5vLDktjR2pfAU8cR67906X0&scope=offline_access%20read%3Ajira-user%20read%3Ajira-work%20write%3Ajira-work&redirect_uri=https%3A%2F%2Fapi.generaltask.io%2Fauthorize2%2Fjira%2Fcallback%2F&state=state-token&response_type=code&prompt=consent"
	c.Redirect(302, authURL)
}

func (api *API) authorizeJIRACallback(c *gin.Context) {
	authToken, err := c.Cookie("authToken")
	if err != nil {
		c.JSON(401, gin.H{"detail": "missing authToken cookie"})
		return
	}
	db, dbCleanup := GetDBConnection()
	defer dbCleanup()
	internalAPITokenCollection := db.Collection("internal_api_tokens")
	var internalToken InternalAPIToken
	err = internalAPITokenCollection.FindOne(nil, bson.D{{"token", authToken}}).Decode(&internalToken)
	if err != nil {
		c.JSON(401, gin.H{"detail": "invalid auth token"})
		return
	}
	// See https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/
	var redirectParams JIRARedirectParams
	if c.ShouldBind(&redirectParams) != nil || redirectParams.Code == "" {
		c.JSON(400, gin.H{"detail": "Missing query params"})
		return
	}
	params := []byte(`{"grant_type": "authorization_code","client_id": "7sW3nPubP5vLDktjR2pfAU8cR67906X0","client_secret": "u3kul-2ZWQP6j_Ial54AGxSWSxyW1uKe2CzlQ64FFe_cTc8GCbCBtFOSFZZhh-Wc","code": "` + redirectParams.Code + `","redirect_uri": "https://api.generaltask.io/authorize2/jira/callback/"}`)
	tokenURL := "https://auth.atlassian.com/oauth/token"
	if api.JIRAConfigValues.TokenURL != nil {
		tokenURL = *api.JIRAConfigValues.TokenURL
	}
	req, err := http.NewRequest("POST", tokenURL, bytes.NewBuffer(params))
	if err != nil {
		log.Printf("Error forming token request: %v", err)
		c.JSON(400, gin.H{"detail": "Error forming token request"})
		return
	}
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to request token: %v", err)
		c.JSON(400, gin.H{"detail": "Failed to request token"})
		return
	}
	tokenString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read token response: %v", err)
		c.JSON(400, gin.H{"detail": "Failed to read token response"})
		return
	}
	if resp.StatusCode != 200 {
		log.Printf("JIRA authorization failed: %s", tokenString)
		c.JSON(400, gin.H{"detail": "Authorization failed"})
		return
	}

	externalAPITokenCollection := db.Collection("external_api_tokens")
	_, err = externalAPITokenCollection.UpdateOne(
		nil,
		bson.D{{"user_id", internalToken.UserID}, {"source", "jira"}},
		bson.D{{"$set", &ExternalAPIToken{UserID: internalToken.UserID, Source: "jira", Token: string(tokenString)}}},
		options.Update().SetUpsert(true),
	)

	if err != nil {
		log.Fatalf("Failed to create external token record: %v", err)
	}

	c.Redirect(302, GetConfigValue("HOME_URL"))
}

func (api *API) login(c *gin.Context) {
	authURL := api.GoogleConfig.AuthCodeURL("state-token", oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	c.Redirect(302, authURL)
}

func (api *API) loginCallback(c *gin.Context) {
	var redirectParams GoogleRedirectParams
	if c.ShouldBind(&redirectParams) != nil || redirectParams.State == "" || redirectParams.Code == "" || redirectParams.Scope == "" {
		c.JSON(400, gin.H{"detail": "Missing query params"})
		return
	}
	token, err := api.GoogleConfig.Exchange(context.Background(), redirectParams.Code)
	if err != nil {
		log.Fatalf("Failed to fetch token from google: %v", err)
	}
	client := api.GoogleConfig.Client(context.Background(), token)
	response, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		log.Fatalf("Failed to load user info: %v", err)
	}
	defer response.Body.Close()
	var userInfo GoogleUserInfo

	err = json.NewDecoder(response.Body).Decode(&userInfo)

	lowerEmail := strings.ToLower(userInfo.EMAIL)
	if _, contains := ALLOWED_USERNAMES[strings.ToLower(userInfo.EMAIL)]; !contains && !strings.HasSuffix(lowerEmail, "@generaltask.io") {
		c.JSON(403, gin.H{"detail": "Email has not been approved."})
		return
	}

	if err != nil {
		log.Fatalf("Error decoding JSON: %v", err)
	}
	if userInfo.SUB == "" {
		log.Fatal("Failed to retrieve google user ID")
	}

	db, dbCleanup := GetDBConnection()
	defer dbCleanup()
	userCollection := db.Collection("users")

	var user User
	var insertedUserID primitive.ObjectID
	if userCollection.FindOne(nil, bson.D{{Key: "google_id", Value: userInfo.SUB}}).Decode(&user) != nil {
		cursor, err := userCollection.InsertOne(nil, &User{GoogleID: userInfo.SUB, Email: userInfo.EMAIL})
		insertedUserID = cursor.InsertedID.(primitive.ObjectID)
		if err != nil {
			log.Fatalf("Failed to create new user in db: %v", err)
		}
	} else {
		insertedUserID = user.ID
	}

	tokenString, err := json.Marshal(&token)
	if err != nil {
		log.Fatalf("Failed to serialize token json: %v", err)
	}
	externalAPITokenCollection := db.Collection("external_api_tokens")
	_, err = externalAPITokenCollection.UpdateOne(
		nil,
		bson.D{{"user_id", insertedUserID}, {"source", "google"}},
		bson.D{{"$set", &ExternalAPIToken{UserID: insertedUserID, Source: "google", Token: string(tokenString)}}},
		options.Update().SetUpsert(true),
	)

	if err != nil {
		log.Fatalf("Failed to create external token record: %v", err)
	}
	internalToken := guuid.New().String()
	internalAPITokenCollection := db.Collection("internal_api_tokens")
	_, err = internalAPITokenCollection.UpdateOne(
		nil,
		bson.D{{"user_id", insertedUserID}},
		bson.D{{"$set", &InternalAPIToken{UserID: insertedUserID, Token: internalToken}}},
		options.Update().SetUpsert(true),
	)

	if err != nil {
		log.Fatalf("Failed to create internal token record: %v", err)
	}
	c.SetCookie("authToken", internalToken, 60*60*24, "/", GetConfigValue("COOKIE_DOMAIN"), false, false)
	c.Redirect(302, GetConfigValue("HOME_URL"))
}

func (api *API) logout(c *gin.Context) {
	token, err := getToken(c)
	if err != nil {
		return
	}
	db, dbCleanup := GetDBConnection()
	defer dbCleanup()

	tokenCollection := db.Collection("internal_api_tokens")
	result, err := tokenCollection.DeleteOne(nil, bson.M{"token": token})
	if err != nil {
		log.Fatal(err)
	}
	if result.DeletedCount == 0 {
		c.AbortWithStatusJSON(401, gin.H{"detail": "unauthorized"})
	} else {
		c.JSON(200, gin.H{})
	}

}

func (api *API) tasksList(c *gin.Context) {
	db, dbCleanup := GetDBConnection()
	defer dbCleanup()
	externalAPITokenCollection := db.Collection("external_api_tokens")
	var googleToken ExternalAPIToken
	userID, _ := c.Get("user")
	err := externalAPITokenCollection.FindOne(nil, bson.D{{Key: "user_id", Value: userID}, {Key: "source", Value: "google"}}).Decode(&googleToken)

	if err != nil {
		log.Fatalf("Failed to fetch external API token: %v", err)
	}

	var token oauth2.Token
	json.Unmarshal([]byte(googleToken.Token), &token)
	config := getGoogleConfig()
	client := config.Client(context.Background(), &token).(*http.Client)

	var calendarEvents = make(chan []*CalendarEvent)
	go loadCalendarEvents(client, calendarEvents, nil)

	var emails = make(chan []*Email)
	go loadEmails(c, client, emails)

	var JIRATasks = make(chan []*Task)
	go loadJIRATasks(api, externalAPITokenCollection, userID.(primitive.ObjectID), JIRATasks)

	allTasks := mergeTasks(<-calendarEvents, <-emails, <-JIRATasks, "gmail.com")
	c.JSON(200, allTasks)
}

func mergeTasks(calendarEvents []*CalendarEvent, emails []*Email, JIRATasks []*Task, userDomain string) []*TaskGroup {

	//sort calendar events by start time.
	sort.SliceStable(calendarEvents, func(i, j int) bool {
		return calendarEvents[i].DatetimeStart.Time().Before(calendarEvents[j].DatetimeStart.Time())
	})

	var allUnscheduledTasks []interface{}
	for _, e := range emails {
		allUnscheduledTasks = append(allUnscheduledTasks, e)
	}

	for _, t := range JIRATasks {
		allUnscheduledTasks = append(allUnscheduledTasks, t)
	}

	//first we sort the emails and tasks into a single array
	sort.SliceStable(allUnscheduledTasks, func(i, j int) bool {
		a := allUnscheduledTasks[i]
		b := allUnscheduledTasks[j]

		switch a.(type) {
		case *Task:
			switch b.(type) {
			case *Task:
				return compareTasks(a.(*Task), b.(*Task))
			case *Email:
				return compareTaskEmail(a.(*Task), b.(*Email), userDomain)
			}
		case *Email:
			switch b.(type) {
			case *Task:
				return !compareTaskEmail(b.(*Task), a.(*Email), userDomain)
			case *Email:
				return compareEmails(a.(*Email), b.(*Email), userDomain)
			}
		}
		return true
	})

	//we then fill in the gaps with calendar events with these tasks

	var tasks []interface{}
	taskGroups := []*TaskGroup{}

	lastEndTime := time.Now()
	taskIndex := 0
	calendarIndex := 0

	var totalDuration int64

	for ; calendarIndex < len(calendarEvents); calendarIndex++ {
		calendarEvent := calendarEvents[calendarIndex]

		if taskIndex >= len(allUnscheduledTasks) {
			break
		}

		remainingTime := calendarEvent.DatetimeStart.Time().Sub(lastEndTime)

		timeAllocation := getTimeAllocation(allUnscheduledTasks[taskIndex])
		for remainingTime.Nanoseconds() >= timeAllocation {
			tasks = append(tasks, allUnscheduledTasks[taskIndex])
			remainingTime -= time.Duration(timeAllocation)
			totalDuration += timeAllocation
			taskIndex += 1
			timeAllocation = getTimeAllocation(allUnscheduledTasks[taskIndex])
			if taskIndex >= len(allUnscheduledTasks) {
				break
			}
		}

		if len(tasks) > 0 {
			taskGroups = append(taskGroups, &TaskGroup{
				TaskGroupType: UnscheduledGroup,
				StartTime:     lastEndTime.String(),
				Duration:      totalDuration / int64(time.Second),
				Tasks:         tasks,
			})
			totalDuration = 0
			tasks = nil
		}

		taskGroups = append(taskGroups, &TaskGroup{
			TaskGroupType: ScheduledTask,
			StartTime:     calendarEvent.DatetimeStart.Time().String(),
			Duration:      int64(calendarEvent.DatetimeEnd.Time().Sub(calendarEvent.DatetimeStart.Time()).Seconds()),
			Tasks:         []interface{}{calendarEvent},
		})

		lastEndTime = calendarEvent.DatetimeEnd.Time()
	}

	//add remaining calendar events, if they exist.
	for ; calendarIndex < len(calendarEvents); calendarIndex++ {
		calendarEvent := calendarEvents[calendarIndex]

		taskGroups = append(taskGroups, &TaskGroup{
			TaskGroupType: ScheduledTask,
			StartTime:     calendarEvent.DatetimeStart.Time().String(),
			Duration:      int64(calendarEvent.DatetimeEnd.Time().Sub(calendarEvent.DatetimeStart.Time()).Seconds()),
			Tasks:         []interface{}{calendarEvent},
		})
		lastEndTime = calendarEvent.DatetimeEnd.Time()
	}

	//add remaining non scheduled events, if they exist.
	tasks = nil
	for ; taskIndex < len(allUnscheduledTasks); taskIndex++ {
		t := allUnscheduledTasks[taskIndex]
		tasks = append(tasks, t)
		totalDuration += getTimeAllocation(t)
	}
	if len(tasks) > 0 {
		taskGroups = append(taskGroups, &TaskGroup{
			TaskGroupType: UnscheduledGroup,
			StartTime:     lastEndTime.String(),
			Duration:      totalDuration / int64(time.Second),
			Tasks:         tasks,
		})
	}
	return taskGroups
}

func getTimeAllocation(t interface{}) int64 {
	//We can't just cast this to TaskBase so we need to switch
	switch t.(type) {
	case *Email:
		return t.(*Email).TimeAllocation
	case *Task:
		return t.(*Task).TimeAllocation
	default:
		return 0
	}
}

func compareEmails(e1 *Email, e2 *Email, myDomain string) bool {
	if e1.SenderDomain == myDomain && e2.SenderDomain != myDomain {
		return true
	} else if e1.SenderDomain != myDomain && e2.SenderDomain == myDomain {
		return false
	} else {
		return e1.TimeSent < e2.TimeSent
	}
}

func compareTasks(t1 *Task, t2 *Task) bool {
	sevenDaysFromNow := time.Now().AddDate(0, 0, 7)
	//if both have due dates before seven days, prioritize the one with the closer due date.
	if t1.DueDate > 0 &&
		t2.DueDate > 0 &&
		t1.DueDate.Time().Before(sevenDaysFromNow) &&
		t2.DueDate.Time().Before(sevenDaysFromNow) {
		return t1.DueDate.Time().Before(t2.DueDate.Time())
	} else if t1.DueDate > 0 && t1.DueDate.Time().Before(sevenDaysFromNow) {
		//t1 is due within seven days, t2 is not so prioritize t1
		return true
	} else if t2.DueDate > 0 && t2.DueDate.Time().Before(sevenDaysFromNow) {
		//t2 is due within seven days, t1 is not so prioritize t2
		return false
	} else if t1.Priority != t2.Priority {
		//if either have a priority, choose the one with the higher priority
		return t1.Priority > t2.Priority
	} else {
		//if all else fails prioritize by task number.
		return t1.TaskNumber < t2.TaskNumber
	}
}

func compareTaskEmail(t *Task, e *Email, myDomain string) bool {
	return e.SenderDomain != myDomain
}

func loadEmails(c *gin.Context, client *http.Client, result chan<- []*Email) {
	db, dbCleanup := GetDBConnection()
	defer dbCleanup()
	var userObject User
	userID, _ := c.Get("user")
	userCollection := db.Collection("users")
	err := userCollection.FindOne(nil, bson.D{{Key: "_id", Value: userID}}).Decode(&userObject)

	emails := []*Email{}

	gmailService, err := gmail.New(client)
	if err != nil {
		log.Fatalf("Unable to create Gmail service: %v", err)
	}

	taskCollection := db.Collection("tasks")

	threadsResponse, err := gmailService.Users.Threads.List("me").Q("is:unread").Do()
	if err != nil {
		log.Fatalf("Failed to load Gmail threads for user: %v", err)
	}
	for _, threadListItem := range threadsResponse.Threads {
		thread, err := gmailService.Users.Threads.Get("me", threadListItem.Id).Do()
		if err != nil {
			log.Fatalf("failed to load thread! %v", err)
		}
		var sender = ""
		var title = ""
		for _, header := range thread.Messages[0].Payload.Headers {
			if header.Name == "From" {
				sender = header.Value
			}
			if header.Name == "Subject" {
				title = header.Value
			}
		}

		email := &Email{
			TaskBase: TaskBase{
				IDExternal: threadListItem.Id,
				Sender:     extractSenderName(sender),
				Source:     TaskSourceGmail.Name,
				Deeplink:   fmt.Sprintf("https://mail.google.com/mail?authuser=%s#all/%s", userObject.Email, threadListItem.Id),
				Title:      title,
				Logo:       TaskSourceGmail.Logo,
			},
			SenderDomain: "gmail.com", // TODO: read in sender domain
		}
		taskCollection.UpdateOne(
			nil,
			bson.M{
				"$and": []bson.M{
					{"id_external": email.IDExternal},
					{"source": email.Source},
				},
			},
			bson.D{{"$set", email}},
			options.Update().SetUpsert(true),
		)
		emails = append(emails, email)
	}

	result <- emails
}

func extractSenderName(sendLine string) string {
	exp := regexp.MustCompile("(.+[^\\s])\\s+<(.+)>")
	matches := exp.FindStringSubmatch(sendLine)
	if len(matches) == 3 {
		return matches[1]
	} else {
		return sendLine
	}
}

func loadCalendarEvents(client *http.Client, result chan<- []*CalendarEvent, overrideUrl *string) {
	events := []*CalendarEvent{}

	var calendarService *calendar.Service
	var err error

	if overrideUrl != nil {
		calendarService, err = calendar.NewService(context.Background(), option.WithoutAuthentication(), option.WithEndpoint(*overrideUrl))
	} else {
		calendarService, err = calendar.New(client)
	}
	if err != nil {
		log.Fatalf("Unable to create Calendar service: %v", err)
	}

	db, dbCleanup := GetDBConnection()
	defer dbCleanup()
	taskCollection := db.Collection("tasks")

	t := time.Now()
	//strip out hours/minutes/seconds of today to find the start of the day
	todayStartTime := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
	//get end of day but adding one day to start of day and then subtracting a second to get day at 11:59:59PM
	todayEndTime := todayStartTime.AddDate(0, 0, 1).Add(-time.Second)

	calendarResponse, err := calendarService.Events.
		List("primary").
		TimeMin(todayStartTime.Format(time.RFC3339)).
		TimeMax(todayEndTime.Format(time.RFC3339)).
		SingleEvents(true).
		OrderBy("startTime").
		Do()

	if err != nil {
		log.Fatalf("Unable to load calendar events: %v", err)
	}

	for _, event := range calendarResponse.Items {
		//exclude all day events which won't have a start time.
		if len(event.Start.DateTime) == 0 {
			continue
		}

		//exclude clockwise events
		if strings.Contains(strings.ToLower(event.Summary), "via clockwise") {
			continue
		}

		startTime, _ := time.Parse(time.RFC3339, event.Start.DateTime)
		endTime, _ := time.Parse(time.RFC3339, event.End.DateTime)

		event := &CalendarEvent{
			TaskBase: TaskBase{
				IDExternal: event.Id,
				Deeplink:   event.HtmlLink,
				Source:     TaskSourceGoogleCalendar.Name,
				Title:      event.Summary,
				Logo:       TaskSourceGoogleCalendar.Logo,
			},
			DatetimeEnd:   primitive.NewDateTimeFromTime(endTime),
			DatetimeStart: primitive.NewDateTimeFromTime(startTime),
		}
		taskCollection.UpdateOne(
			nil,
			bson.M{
				"$and": []bson.M{
					{"id_external": event.IDExternal},
					{"source": event.Source},
				},
			},
			bson.D{{"$set", event}},
			options.Update().SetUpsert(true),
		)
		events = append(events, event)
	}
	result <- events
}

func loadJIRATasks(api *API, externalAPITokenCollection *mongo.Collection, userID primitive.ObjectID, result chan<- []*Task) {
	var JIRAToken ExternalAPIToken
	err := externalAPITokenCollection.FindOne(nil, bson.D{{Key: "user_id", Value: userID}, {Key: "source", Value: "jira"}}).Decode(&JIRAToken)
	if err != nil {
		// No JIRA token exists, so don't populate result
		result <- []*Task{}
		return
	}

	db, dbCleanup := GetDBConnection()
	defer dbCleanup()
	taskCollection := db.Collection("tasks")

	var token JIRAAuthToken
	err = json.Unmarshal([]byte(JIRAToken.Token), &token)
	if err != nil {
		log.Printf("Failed to parse JIRA token: %v", err)
		result <- []*Task{}
		return
	}
	params := []byte(`{"grant_type": "refresh_token","client_id": "7sW3nPubP5vLDktjR2pfAU8cR67906X0","client_secret": "u3kul-2ZWQP6j_Ial54AGxSWSxyW1uKe2CzlQ64FFe_cTc8GCbCBtFOSFZZhh-Wc","refresh_token": "` + token.RefreshToken + `"}`)
	tokenURL := "https://auth.atlassian.com/oauth/token"
	if api.JIRAConfigValues.TokenURL != nil {
		tokenURL = *api.JIRAConfigValues.TokenURL
	}
	req, err := http.NewRequest("POST", tokenURL, bytes.NewBuffer(params))
	if err != nil {
		log.Printf("Error forming token request: %v", err)
		result <- []*Task{}
		return
	}
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to request token: %v", err)
		result <- []*Task{}
		return
	}
	tokenString, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read token response: %v", err)
		result <- []*Task{}
		return
	}
	if resp.StatusCode != 200 {
		log.Printf("JIRA authorization failed: %s", tokenString)
		result <- []*Task{}
		return
	}
	var newToken JIRAAuthToken
	err = json.Unmarshal(tokenString, &newToken)
	if err != nil {
		log.Printf("Failed to parse new JIRA token: %v", err)
		result <- []*Task{}
		return
	}

	cloudIDURL := "https://api.atlassian.com/oauth/token/accessible-resources"
	if api.JIRAConfigValues.CloudIDURL != nil {
		cloudIDURL = *api.JIRAConfigValues.CloudIDURL
	}
	req, err = http.NewRequest("GET", cloudIDURL, nil)
	if err != nil {
		log.Printf("Error forming cloud ID request: %v", err)
		result <- []*Task{}
		return
	}
	req.Header.Add("Authorization", "Bearer "+newToken.AccessToken)
	req.Header.Add("Content-Type", "application/json")
	resp, err = http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to load cloud ID: %v", err)
		result <- []*Task{}
		return
	}
	cloudIDData, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read cloudID response: %v", err)
		result <- []*Task{}
		return
	}
	if resp.StatusCode != 200 {
		log.Printf("CloudID request failed: %s", cloudIDData)
		result <- []*Task{}
		return
	}
	JIRASites := []JIRASite{}
	err = json.Unmarshal(cloudIDData, &JIRASites)
	if err != nil {
		log.Printf("Failed to parse cloud ID response: %v", err)
		result <- []*Task{}
		return
	}

	if len(JIRASites) == 0 {
		log.Println("No accessible JIRA resources found")
		result <- []*Task{}
		return
	}
	cloudID := JIRASites[0].ID
	apiBaseURL := "https://api.atlassian.com/ex/jira/" + cloudID
	if api.JIRAConfigValues.APIBaseURL != nil {
		apiBaseURL = *api.JIRAConfigValues.APIBaseURL
	}
	JQL := "assignee=currentuser() AND status != Done"
	req, err = http.NewRequest("GET", apiBaseURL+"/rest/api/2/search?jql="+url.QueryEscape(JQL), nil)
	if err != nil {
		log.Printf("Error forming search request: %v", err)
		result <- []*Task{}
		return
	}
	req.Header.Add("Authorization", "Bearer "+newToken.AccessToken)
	req.Header.Add("Content-Type", "application/json")
	resp, err = http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to load search results: %v", err)
		result <- []*Task{}
		return
	}
	taskData, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read search response: %v", err)
		result <- []*Task{}
		return
	}
	if resp.StatusCode != 200 {
		log.Printf("Search failed: %s %v", taskData, resp.StatusCode)
		result <- []*Task{}
		return
	}

	var jiraTasks JIRATaskList
	err = json.Unmarshal(taskData, &jiraTasks)
	if err != nil {
		log.Printf("Failed to parse JIRA tasks: %v", err)
		result <- []*Task{}
		return
	}

	var tasks []*Task
	for _, jiraTask := range jiraTasks.Issues {
		task := &Task{
			TaskBase: TaskBase{
				IDExternal: jiraTask.ID,
				Deeplink:   JIRASites[0].URL + "/browse/" + jiraTask.Key,
				Source:     TaskSourceJIRA.Name,
				Title:      jiraTask.Fields.Summary,
				Logo:       TaskSourceJIRA.Logo,
			},
		}
		dueDate, err := time.Parse("2006-01-02", jiraTask.Fields.DueDate)
		if err == nil {
			task.DueDate = primitive.NewDateTimeFromTime(dueDate)
		}
		taskCollection.UpdateOne(
			nil,
			bson.M{
				"$and": []bson.M{
					{"id_external": task.IDExternal},
					{"source": task.Source},
				},
			},
			bson.D{{"$set", task}},
			options.Update().SetUpsert(true),
		)
		tasks = append(tasks, task)
	}
	result <- tasks
}

func (api *API) ping(c *gin.Context) {
	log.Println("success!")
	c.JSON(200, "success")
}

func tokenMiddleware(c *gin.Context) {
	handlerName := c.HandlerName()
	if handlerName[len(handlerName)-9:] == "handle404" {
		// Do nothing if the route isn't recognized
		return
	}
	token, err := getToken(c)
	if err != nil {
		// This means the auth token format was incorrect
		return
	}
	log.Println("Token: \"" + token + "\"")
	db, dbCleanup := GetDBConnection()
	defer dbCleanup()
	internalAPITokenCollection := db.Collection("internal_api_tokens")
	var internalToken InternalAPIToken
	err = internalAPITokenCollection.FindOne(nil, bson.D{{"token", token}}).Decode(&internalToken)
	if err != nil {
		log.Printf("Auth failed: %v\n", err)
		c.AbortWithStatusJSON(401, gin.H{"detail": "unauthorized"})
		return
	}
	log.Println("User ID below!")
	log.Println(internalToken.UserID)
	c.Set("user", internalToken.UserID)
}

func getToken(c *gin.Context) (string, error) {
	token := c.Request.Header.Get("Authorization")
	//Token is 36 characters + 6 for Bearer prefix + 1 for space = 43
	if len(token) != 43 {
		c.AbortWithStatusJSON(401, gin.H{"detail": "incorrect auth token format"})
		return "", errors.New("Incorrect auth token format")
	}
	token = token[7:]
	return token, nil
}

// CORSMiddleware sets CORS headers, abort if CORS preflight request is received
func CORSMiddleware(c *gin.Context) {
	c.Writer.Header().Set("Access-Control-Allow-Headers", "Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers")
	c.Writer.Header().Set("Access-Control-Allow-Origin", GetConfigValue("ACCESS_CONTROL_ALLOW_ORIGIN"))
	c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")
	if c.Request.Method == "OPTIONS" {
		c.AbortWithStatus(http.StatusNoContent)
	}
	c.Next()
}

func handle404(c *gin.Context) {
	c.JSON(404, gin.H{"detail": "not found"})
}

func getRouter(api *API) *gin.Engine {
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
	router.GET("/ping/", api.ping)
	return router
}

func main() {
	getRouter(&API{GoogleConfig: getGoogleConfig()}).Run()
}
