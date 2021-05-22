package templating

import (
	"bytes"
	"html/template"
	"path"
	"runtime"
)

func GetJIRAHTMLString(description string) (string, error) {
	if len(description) == 0 {
		return description, nil
	}

	template := template.Must(template.ParseFiles(getDirectoryOfTemplate("jira_plain_text.html")))
	buffer := new(bytes.Buffer)
	err := template.ExecuteTemplate(buffer, "Description", description)
	return buffer.String(), err
}

func getDirectoryOfTemplate(name string) string {
	_, filename, _, _ := runtime.Caller(1)
	filepath := path.Join(path.Dir(filename), "./templates/" + name)
	return filepath
}