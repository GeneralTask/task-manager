package templating

import (
	"bytes"
	"html/template"
)

func FormatPlainTextAsHTML(text string) (string, error) {
	if len(text) == 0 {
		return text, nil
	}
	plainTextTemplate, _ := template.New("plain_text").Parse("{{ define \"Description\" }}\n<!DOCTYPE html>" +
		"\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <style>\n        html, body {\n            " +
		"font-size: 16px;\n            font-family: \"Gothic A1\", sans-serif;\n        }\n    " +
		"</style>\n</head>\n<body>\n<div>{{ . }}</div>\n</body>\n</html>\n{{ end }}")

	buffer := new(bytes.Buffer)
	err := plainTextTemplate.ExecuteTemplate(buffer, "Description", text)
	return buffer.String(), err
}
