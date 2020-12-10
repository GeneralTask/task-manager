// https://golang.org/doc/editors.html
// https://marketplace.visualstudio.com/items?itemName=golang.go
// https://golang.org/cmd/go/#hdr-GOPATH_environment_variable
package main

func main() {
	migrateAll()
	// b, err := ioutil.ReadFile("credentials.json")
	// if err != nil {
	// 	log.Fatalf("Unable to read credentials file: %v", err)
	// }
	// config, err := google.ConfigFromJSON(b, "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.events")
	// if err != nil {
	// 	log.Fatalf("Unable to parse credentials file to config: %v", err)
	// }
	// authURL := config.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	// fmt.Printf("Authorization link: %v\n", authURL)
	// https://developers.google.com/people/quickstart/go
	// r := gin.Default()
	// r.GET("/ping", func(c *gin.Context) {
	// 	c.JSON(200, gin.H{
	// 		"message": "pong",
	// 	})
	// })
	// r.GET("/login", func(c *gin.Context) {
	// })
	// r.Run()
}
