package external

import (
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"google.golang.org/api/gmail/v1"
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
