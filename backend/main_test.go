package main

import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestLoginRedirect(t *testing.T) {
	// Syntax taken from https://semaphoreci.com/community/tutorials/test-driven-development-of-go-web-applications-with-gin
	r := gin.Default()
	r.GET("/login/", login)

	request, _ := http.NewRequest("GET", "/login/", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, request)
	if w.Code != http.StatusFound {
		t.Fail()
	}
	p, err := ioutil.ReadAll(w.Body)
	if err != nil || string(p) != "<a href=\"https://accounts.google.com/o/oauth2/auth?access_type=offline&amp;client_id=786163085684-uvopl20u17kp4p2vd951odnm6f89f2f6.apps.googleusercontent.com&amp;prompt=consent&amp;redirect_uri=https%3A%2F%2Fgeneraltask.io&amp;response_type=code&amp;scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.modify+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events&amp;state=state-token\">Found</a>.\n\n" {
		t.Fail()
	}
}
