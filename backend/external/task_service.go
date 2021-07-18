package external

type TaskService interface {
	GetLinkAuthURL() (string, error)
	HandleAuthCallback(code string, state string) error
	GetLogoPath() string
	GetName() string
}
