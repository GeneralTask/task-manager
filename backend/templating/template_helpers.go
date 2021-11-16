package templating

import (
	"bytes"
	"html/template"
	"strings"
)

func FormatPlainTextAsHTML(text string) (string, error) {
	if len(text) == 0 {
		return text, nil
	}
	plainTextTemplate, _ := template.New("plain_text").Parse("{{ define \"Description\" }}<!DOCTYPE html>" +
		"<html lang=\"en\"><head>    <meta charset=\"UTF-8\">    <style>        html, body {            " +
		"font-size: 14px;            font-family: \"Gothic A1\", sans-serif;        }    " +
		"</style></head><body><div>{{ . }}</div></body></html>{{ end }}")

	buffer := new(bytes.Buffer)
	err := plainTextTemplate.ExecuteTemplate(buffer, "Description", text)
	result := buffer.String()
	result = strings.Replace(result, "\n", "<br>", -1)
	return result, err
}
