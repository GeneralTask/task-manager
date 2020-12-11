# task-manager
A manager of tasks.

## Setup

First, install Go and Docker.

```
cd backend
go run main.go migrate.go db.go models.go
docker run --name task_postgres -e POSTGRES_PASSWORD=password -p 5433:5432 -d postgres:12

# Inspect the postgres db
docker exec -it task_postgres psql -U postgres
# Hit the API server
curl localhost:8080/ping
```

## Useful links

Google Go client examples: https://github.com/googleapis/google-api-go-client/tree/master/examples
