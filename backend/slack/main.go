package slack

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
)

type Message struct {
	Text string `json:"text"`
}

func SendFeedbackMessage(text string) error {
	// adapted from https://golangcode.com/send-slack-messages-without-a-library/
	webhookURL := config.GetConfigValue("SLACK_WEBHOOK_FEEDBACK")
	if len(webhookURL) == 0 {
		return errors.New("missing slack webhook setting")
	}
	payload, err := json.Marshal(Message{Text: text})
	if err != nil {
		return err
	}
	request, _ := http.NewRequest(
		"POST",
		webhookURL,
		bytes.NewBuffer(payload),
	)
	request.Header.Add("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	response, err := client.Do(request)
	if err != nil {
		return err
	}
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("non-ok status code from slack: %d", response.StatusCode)
	}
	return nil
}
