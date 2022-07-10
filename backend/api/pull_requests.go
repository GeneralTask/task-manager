package api

type PullRequestResult struct {
	ID          string            `json:"id"`
	Title       string            `json:"title"`
	Number      int               `json:"number"`
	Status      PullRequestStatus `json:"status"`
	Author      string            `json:"author"`
	NumComments int               `json:"num_comments"`
	CreatedAt   string            `json:"created_at"`
	Branch      string            `json:"branch"`
	Deeplink    string            `json:"deeplink"`
}

type PullRequestStatus struct {
	Text  string `json:"text"`
	Color string `json:"color"`
}
