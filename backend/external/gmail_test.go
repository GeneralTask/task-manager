package external

import (
	"encoding/base64"
	"fmt"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/testutils"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/api/gmail/v1"
	"net/http/httptest"
	"testing"
)

func TestGetRecipients(t *testing.T) {
	emptyRecipients := make([]database.Recipient, 0)

	t.Run("NoHeaders", func(t *testing.T) {
		headers := make([]*gmail.MessagePartHeader, 0)
		recipients := *GetRecipients(headers)
		expected := database.Recipients{
			To:  emptyRecipients,
			Cc:  emptyRecipients,
			Bcc: emptyRecipients,
		}
		assert.Equal(t, expected, recipients)
	})

	t.Run("OneToRecipient", func(t *testing.T) {
		headers := []*gmail.MessagePartHeader{
			{
				Name:  "To",
				Value: `"Scott" <scott@generaltask.com>`,
			},
		}
		expected := database.Recipients{
			To: []database.Recipient{{
				Name:  "Scott",
				Email: "scott@generaltask.com",
			}},
			Cc:  emptyRecipients,
			Bcc: emptyRecipients,
		}
		recipients := *GetRecipients(headers)
		assert.Equal(t, expected, recipients)
	})

	t.Run("OneToRecipientNoName", func(t *testing.T) {
		headers := []*gmail.MessagePartHeader{
			{
				Name:  "To",
				Value: `"<scott@generaltask.com>`,
			},
		}
		expected := database.Recipients{
			To: []database.Recipient{{
				Name:  "",
				Email: "scott@generaltask.com",
			}},
			Cc:  emptyRecipients,
			Bcc: emptyRecipients,
		}
		recipients := *GetRecipients(headers)
		assert.Equal(t, expected, recipients)
	})

	t.Run("MultipleToRecipients", func(t *testing.T) {
		headers := []*gmail.MessagePartHeader{
			{
				Name:  "To",
				Value: `"Scott" <scott@generaltask.com>, "Nolan" <nolan@generaltask.com>`,
			},
		}
		expected := database.Recipients{
			To: []database.Recipient{
				{
					Name:  "Scott",
					Email: "scott@generaltask.com",
				},
				{
					Name:  "Nolan",
					Email: "nolan@generaltask.com",
				}},
			Cc:  emptyRecipients,
			Bcc: emptyRecipients,
		}
		recipients := *GetRecipients(headers)
		assert.Equal(t, expected, recipients)
	})

	t.Run("MultipleRecipientsAll", func(t *testing.T) {
		headers := []*gmail.MessagePartHeader{
			{
				Name:  "To",
				Value: `"Scott" <scott@generaltask.com>, "Nolan" <nolan@generaltask.com>`,
			},
			{
				Name:  "Cc",
				Value: `"Duck" <duck@email.com>, Goose <goose@email.com>`,
			},
			{
				Name:  "Bcc",
				Value: `scott@generaltask.com, Nolan <nolan@generaltask.com>`,
			},
		}
		expected := database.Recipients{
			To: []database.Recipient{
				{
					Name:  "Scott",
					Email: "scott@generaltask.com",
				},
				{
					Name:  "Nolan",
					Email: "nolan@generaltask.com",
				}},
			Cc: []database.Recipient{
				{
					Name:  "Duck",
					Email: "duck@email.com",
				},
				{
					Name:  "Goose",
					Email: "goose@email.com",
				}},
			Bcc: []database.Recipient{
				{
					Name:  "",
					Email: "scott@generaltask.com",
				},
				{
					Name:  "Nolan",
					Email: "nolan@generaltask.com",
				}},
		}
		recipients := *GetRecipients(headers)
		assert.Equal(t, expected, recipients)
	})
}

func TestGetEmails(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		userID := primitive.NewObjectID()

		////////////////////////////////////////////////////////////////////////////////
		// (1) Arrange: setup testing objects and mock data
		threadsMap := map[string]*gmail.Thread{
			"gmail_thread_1": {
				Id: "gmail_thread_1",
				Messages: []*gmail.Message{
					createTestGmailMessage("gmail_thread_1_email_1", true, true,
						"test subject", "2001-04-20"),
					createTestGmailMessage("gmail_thread_1_email_2", false, true,
						"test subject", "2020-04-20"),
					createTestGmailMessage("gmail_thread_1_email_3", true, false,
						"test subject", "2001-04-20"),
					createTestGmailMessage("gmail_thread_1_email_4", false, false,
						"test subject", "2020-04-20"),
				},
			},
			"gmail_thread_2": {
				Id: "gmail_thread_2",
				Messages: []*gmail.Message{
					createTestGmailMessage("gmail_thread_2_email_1", false, false,
						"test subject", "2019-04-20"),
				},
			},
		}

		server := getGinGmailFetchServer(t, threadsMap)
		defer server.Close()
		mockGmailSource := GmailSource{
			Google: GoogleService{
				OverrideURLs: GoogleURLOverrides{GmailFetchURL: &server.URL},
			},
		}

		////////////////////////////////////////////////////////////////////////////////
		// (2) Act: call the API / perform the work
		var emailResult = make(chan EmailResult)
		go mockGmailSource.GetEmails(userID, "me", emailResult, false)
		result := <-emailResult

		////////////////////////////////////////////////////////////////////////////////
		// (3) Assert: verify results as expected
		assert.NoError(t, result.Error)
		assert.Equal(t, 5, len(result.Emails))

		expectedThreadsInDB := []*database.Item{
			{
				TaskBase: database.TaskBase{
					SourceID:   "gmail",
					IDExternal: "gmail_thread_1",
				},
				TaskType: database.TaskType{IsThread: true},
				EmailThread: database.EmailThread{
					ThreadID:      "gmail_thread_1",
					LastUpdatedAt: *testutils.CreateDateTime("2020-04-20"),
					Emails: []database.Email{
						*createTestThreadEmail("gmail_thread_1_email_1", true, true,
							"gmail_thread_1", "test subject", "2001-04-20"),
						*createTestThreadEmail("gmail_thread_1_email_2", false, true,
							"gmail_thread_1", "test subject", "2020-04-20"),
						*createTestThreadEmail("gmail_thread_1_email_3", true, false,
							"gmail_thread_1", "test subject", "2001-04-20"),
						*createTestThreadEmail("gmail_thread_1_email_4", false, false,
							"gmail_thread_1", "test subject", "2020-04-20"),
					},
				},
			},
			{
				TaskBase: database.TaskBase{
					SourceID:   "gmail",
					IDExternal: "gmail_thread_2",
				},
				TaskType: database.TaskType{IsThread: true},
				EmailThread: database.EmailThread{
					ThreadID:      "gmail_thread_1",
					LastUpdatedAt: *testutils.CreateDateTime("2020-04-20"),
					Emails: []database.Email{
						*createTestThreadEmail("gmail_thread_2_email_1", false, false,
							"gmail_thread_2", "test subject", "2019-04-20"),
					},
				},
			},
		}

		db, dbCleanup, _ := database.GetDBConnection()
		defer dbCleanup()
		threadItems, err := database.GetEmailThreads(db, userID, false, database.Pagination{}, nil)
		assert.NoError(t, err)

		assert.Equal(t, len(expectedThreadsInDB), len(*threadItems))
		if len(expectedThreadsInDB) != len(*threadItems) {
			return
		}
		for i, dbThreadItem := range *threadItems {
			expectedThreadItem := expectedThreadsInDB[i]
			assertThreadItemsEqual(t, expectedThreadItem, &dbThreadItem)

		}
	})
}

func assertThreadItemsEqual(t *testing.T, a *database.Item, b *database.Item) {
	assert.Equal(t, a.TaskType, b.TaskType)
	assert.Equal(t, a.IDExternal, b.IDExternal)
	assert.Equal(t, a.Title, b.Title)
	assert.Equal(t, a.SourceID, b.SourceID)

	assert.Equal(t, len(a.EmailThread.Emails), len(b.EmailThread.Emails))
	for i := range a.EmailThread.Emails {
		aEmail := a.EmailThread.Emails[i]
		bEmail := b.EmailThread.Emails[i]
		aEmail.MessageID = primitive.NilObjectID
		bEmail.MessageID = primitive.NilObjectID
		assert.Equal(t, aEmail, bEmail)
	}
}

func getGinGmailFetchServer(t *testing.T, threadsMap map[string]*gmail.Thread) *httptest.Server {
	return httptest.NewServer(func() *gin.Engine {
		w := httptest.NewRecorder()
		_, r := gin.CreateTestContext(w)

		v1 := r.Group("/gmail/v1/users/:gmailAccountID")
		{
			v1.GET("/threads", func(c *gin.Context) {
				threads := make([]*gmail.Thread, 0, len(threadsMap))
				for _, value := range threadsMap {
					threads = append(threads, value)
				}
				response := &gmail.ListThreadsResponse{Threads: threads}
				c.JSON(200, response)
			})
			v1.GET("/threads/:threadID", func(c *gin.Context) {
				response := threadsMap[c.Param("threadID")]
				c.JSON(200, response)
			})
		}
		return r
	}())
}

func createTestGmailMessage(
	externalMessageID string,
	isUnread bool,
	isArchived bool,
	subject string,
	dt string,
) *gmail.Message {

	res := gmail.Message{
		Id:           externalMessageID,
		InternalDate: testutils.CreateTimestamp(dt).Unix() * 1000,
		Payload: &gmail.MessagePart{
			Body: &gmail.MessagePartBody{
				Data: base64.URLEncoding.EncodeToString([]byte(fmt.Sprintf("test message body %s", externalMessageID))),
			},
			Headers: []*gmail.MessagePartHeader{
				{Name: "From", Value: "First Last <from@generaltask.com>"},
				{Name: "Reply-To", Value: "reply-to@generaltask.com"},
				{Name: "Subject", Value: subject},
				{Name: "Message-ID", Value: fmt.Sprintf("smtp_%s", externalMessageID)},
				{Name: "To", Value: "Recipient <recipient@generaltask.com>,John Test <johntest@generaltask.com>"},
			},
			MimeType: "text/plain",
			// todo - not sure about using `Parts`
			//Parts:    []*gmail.MessagePart{}
		},
	}
	if isUnread {
		res.LabelIds = append(res.LabelIds, "UNREAD")
	}
	if !isArchived {
		res.LabelIds = append(res.LabelIds, "INBOX")
	}
	return &res
}

func createTestThreadEmail(
	externalMessageID string,
	isUnread bool,
	isArchived bool,
	threadID string,
	subject string,
	dt string,
) *database.Email {
	return &database.Email{
		SMTPID:       fmt.Sprintf("smtp_%s", externalMessageID),
		ThreadID:     threadID,
		EmailID:      externalMessageID,
		Subject:      subject,
		Body:         fmt.Sprintf("\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <style>\n        html, body {\n            font-size: 16px;\n            font-family: \"Gothic A1\", sans-serif;\n        }\n    </style>\n</head>\n<body>\n<div>test message body %s</div>\n</body>\n</html>\n", externalMessageID),
		SenderDomain: "generaltask.com",
		SenderEmail:  "from@generaltask.com",
		SenderName:   "First Last",
		ReplyTo:      "reply-to@generaltask.com",
		IsUnread:     isUnread,
		IsArchived:   isArchived,
		Recipients: database.Recipients{
			To: []database.Recipient{
				{Name: "Recipient", Email: "recipient@generaltask.com"},
				{Name: "John Test", Email: "johntest@generaltask.com"},
			},
			Cc:  []database.Recipient{},
			Bcc: []database.Recipient{},
		},
		SentAt: *testutils.CreateDateTime(dt),
	}
}
