package main

import "log"

// MigrateAll automigrates all models
func migrateAll() {
	db := getDBConnection()
	err := db.AutoMigrate(&User{}, &InternalAPIToken{}, &ExternalAPIToken{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
}
