package utils

import (
	"regexp"
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
	exp := regexp.MustCompile("@(\\S+)")
	matches := exp.FindStringSubmatch(email)
	if len(matches) == 2 {
		return matches[1]
	} else {
		return email
	}
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
