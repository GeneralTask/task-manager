package utils

import (
	"bytes"
	"errors"
	"net/http"
	"regexp"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
)

func ExtractSenderName(sendLine string) (string, string) {
	exp := regexp.MustCompile("([^\"].+[^\\s\"])\"*\\s+<(.+)>")
	matches := exp.FindStringSubmatch(sendLine)
	if len(matches) == 3 {
		return matches[1], matches[2]
	} else {
		return sendLine, sendLine
	}
}

func ExtractEmailDomain(email string) string {
	exp := regexp.MustCompile("@(\\S+)") //nolint
	matches := exp.FindStringSubmatch(email)
	if len(matches) == 2 {
		return matches[1]
	} else {
		return email
	}
}

func IsOpenEmailAddress(domain string) bool {
	return constants.OPEN_EMAIL_PROVIDERS[domain]
}

// Email validation taken from https://golangcode.com/validate-an-email-address/
var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

// isEmailValid checks if the email provided passes the required structure and length.
func IsEmailValid(e string) bool {
	if len(e) < 3 && len(e) > 254 {
		return false
	}
	return emailRegex.MatchString(e)
}

const MANDRILL_SEND_URL = "https://mandrillapp.com/api/1.0/messages/send"

func TestMailchimpEmail() error {
	testMessage := `{"key": "` + config.GetConfigValue("MANDRILL_CLIENT_SECRET") + `", "message": {"from_email": "julian@generaltask.com", "subject": "General Task Test", "text": "Testing emails from General Task!", "to": [{ "email": "julian@generaltask.com", "type": "to" }]}}`
	req, _ := http.NewRequest("POST", MANDRILL_SEND_URL, bytes.NewBuffer([]byte(testMessage)))
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	if resp.StatusCode != http.StatusOK {
		return errors.New("email send failed")
	}
	return nil
}
