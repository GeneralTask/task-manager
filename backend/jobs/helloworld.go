package jobs

import "fmt"

func helloworld() {
	err := EnsureJobOnlyRunsOnceToday("helloworld")
	if err != nil {
		return
	}
	fmt.Println("Hello, there, world!")
}
