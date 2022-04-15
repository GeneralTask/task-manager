package external

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/rs/zerolog/log"
	"io/ioutil"
	"net/http"
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
	if response.StatusCode != http.StatusOK && response.StatusCode != http.StatusCreated {
		if err == nil {
			log.Error().Str("responseBody", string(responseBody)).Msg("bad response body")
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
