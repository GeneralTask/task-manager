package main

import (
	"fmt"
	"time"
)

func main() {
	for {
		time.Sleep(time.Second * 5)
		fmt.Println("hello there!", time.Now())
	}
}
