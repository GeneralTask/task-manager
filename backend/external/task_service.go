package external

type TaskService interface {
	GetLinkAuthURL() (string, error)
	HandleAuthCallback() error
	GetLogoPath() string
	GetName() string
}
