// package utils

// import 	"mvdan.cc/xurls/v2"

// var ConferencePatterns = map[string]&database.ConferenceCall{
// 	"conference.google.com": &database.ConferenceCall{
// 		Platform: "Google Hangouts",
// 		Logo:     "https://hangouts.google.com/hangouts/images/hangouts_logo_dark.png",
// 	}
// }

// // only return the first conference url - in the future we may want to return all of them
// func GetConferenceUrlFromString(text string) (string) {
// 	for _, match := range xurls.Strict().FindAllString(text, -1) {
// 		if strings.Contains(match, "conference.google.com") {
// 			conference := &database.ConferenceCall{
// 				Platform: "Google Hangouts",
// 				Logo:     "https://hangouts.google.com/hangouts/images/hangouts_logo_dark.png",
// 				URL:      match,
// 			}
// 			return conference
// 		}
// 	}
// }

