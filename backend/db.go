package main

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func getDBConnection() *gorm.DB {
	dsn := "host=localhost user=postgres dbname=postgres password=password port=5433 sslmode=disable TimeZone=US/Pacific"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to open DB connection: %v", err)
	}
	return db
}
