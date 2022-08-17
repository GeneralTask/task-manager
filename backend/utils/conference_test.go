package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetConferenceUrlFromString(t *testing.T) {
	t.Run("No URLs", func(t *testing.T) {
		text := "No URLs here"
		conference := GetConferenceUrlFromString(text)
		assert.Nil(t, conference)
	})

	t.Run("Google Meet URL", func(t *testing.T) {
		text := "Join this meeting: https://meet.google.com/abcd-to-da-moon/ \n more text"
		conference := GetConferenceUrlFromString(text)
		expected := ConferenceCall{
			Platform: "Google Meet",
			Logo:     "/images/google-meet.svg",
			URL:      "https://meet.google.com/abcd-to-da-moon/",
		}
		assert.Equal(t, expected, *conference)
	})

	t.Run("Zoom URL", func(t *testing.T) {
		text := "Join this meeting: https://zoom.us/j/abcd-to-da-moon/ \n more text"
		conference := GetConferenceUrlFromString(text)
		expected := ConferenceCall{
			Platform: "Zoom",
			Logo:     "/images/zoom.svg",
			URL:      "https://zoom.us/j/abcd-to-da-moon/",
		}
		assert.Equal(t, expected, *conference)
	})

	t.Run("Corporate Zoom URL", func(t *testing.T) {
		text := "Join this meeting: https://medtronic.zoom.us/j/4746676152?pwd=d28xd29Nblp1QXh6MlJvZ3ZheHBUZz09 \n more text"
		conference := GetConferenceUrlFromString(text)
		expected := ConferenceCall{
			Platform: "Zoom",
			Logo:     "/images/zoom.svg",
			URL:      "https://medtronic.zoom.us/j/4746676152?pwd=d28xd29Nblp1QXh6MlJvZ3ZheHBUZz09",
		}
		assert.Equal(t, expected, *conference)
	})

	t.Run("Other URLs", func(t *testing.T) {
		text := "This is very important https://youtu.be/dQw4w9WgXcQ"
		conference := GetConferenceUrlFromString(text)
		assert.Nil(t, conference)
	})
}
