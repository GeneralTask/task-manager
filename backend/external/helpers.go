package external

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/GeneralTask/task-manager/backend/logging"
)

type EmptyResponse struct{}

var EmptyResponsePlaceholder = &EmptyResponse{}

func getJSON(client *http.Client, url string, data interface{}) error {
	return requestJSON(client, "GET", url, "", data)
}

func requestJSON(client *http.Client, method string, url string, body string, data interface{}) error {
	request, err := http.NewRequest(method, url, bytes.NewBuffer([]byte(body)))
	if err != nil {
		return err
	}
	response, err := client.Do(request)
	if err != nil {
		return err
	}
	responseBody, bodyErr := ioutil.ReadAll(response.Body)
	logger := logging.GetSentryLogger()
	if response.StatusCode != http.StatusOK && response.StatusCode != http.StatusCreated {
		if err == nil {
			logger.Error().Str("responseBody", string(responseBody)).Msg("bad response body")
		}
		return fmt.Errorf("bad status code: %d", response.StatusCode)
	}
	if bodyErr != nil {
		return err
	}
	err = json.Unmarshal(responseBody, data)
	if err != nil {
		return err
	}
	return nil
}
