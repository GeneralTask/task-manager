package utils

import "regexp"

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
