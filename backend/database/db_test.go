package database

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCreateDBHandle(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		dbh, err := CreateDBHandle()
		assert.NoError(t, err)
		assert.NotNil(t, dbh)
	})
}
