package main

import "github.com/gin-gonic/gin"

func main() {
	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	r.GET("/login", func(c *gin.Context) {
		b, err := ioutil.ReadFile("credentials.json")
		if err != nil {
			log.Fatalf("Unable to read credentials file: %v", err)
		}
		config, err := google.ConfigFromJSON(b)
		if err != nil {
			log.Fatalf("Unable to parse credentials file to config: %v", err)
		}
		// https://developers.google.com/people/quickstart/go
	})
	r.Run()
}
