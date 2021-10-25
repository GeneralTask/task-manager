package migrations

import (
	"fmt"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/mongodb"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func RunMigrations(relativePath string) error {
	migrate, err := getMigrate(relativePath)
	if err != nil {
		return err
	}
	err = migrate.Up()
	if err != nil && err.Error() == "no change" {
		// we consider a no op to be a successful migration run
		return nil
	}
	return err
}

func getMigrate(relativePath string) (*migrate.Migrate, error) {
	filePath := fmt.Sprintf("file://%s", relativePath)
	migrate, err := migrate.New(filePath, config.GetConfigValue("MONGO_URI_MIGRATIONS"))
	if err != nil {
		return nil, err
	}
	return migrate, nil
}
