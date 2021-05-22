package templating

import (
	"bytes"
	"html/template"
	"path"
	"runtime"
)

func FormatPlainTextAsHTML(text string) (string, error) {
	if len(text) == 0 {
		return text, nil
	}

	template := template.Must(template.ParseFiles(getDirectoryOfTemplate("plain_text_template.html")))
	buffer := new(bytes.Buffer)
	err := template.ExecuteTemplate(buffer, "Description", text)
	return buffer.String(), err
}

func getDirectoryOfTemplate(name string) string {
	_, filename, _, _ := runtime.Caller(1)
	filepath := path.Join(path.Dir(filename), "./templates/" + name)
	return filepath
}
