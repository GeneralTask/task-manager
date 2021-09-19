package external

type TrelloSource struct {
	Atlassian AtlassianService
}

type TrelloBoard struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Desc string `json:"desc"`
	// Closed bool   `json:"closed"`
	URL string `json:"url"`
}

type TrelloCard struct {
	ID        string   `json:"id"`
	Desc      string   `json:"desc"`
	Due       string   `json:"due"` // "date"
	BoardID   string   `json:"idBoard"`
	ListID    string   `json:"idList"`
	MembersID []string `json:"idMembers"`
	Name      string   `json:"name"`
	URL       string   `json:"url"`
}
