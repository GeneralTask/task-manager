package external

type TaskSource interface {
	GetTasks() (interface{}, error)
	MarkTaskAsDone() error
	CompareTo() bool
}
