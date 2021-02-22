# task-manager
A manager of tasks.

## Frontend testing

First, install npm.

```
cd frontend
npm install
npm start
```

## Backend setup

First, install Go and Docker.

```
cd backend
docker-compose up -d
go run main.go db.go models.go

# Hit the API server
curl localhost:8080/ping
```

## Backend testing

```
docker-compose up -d
go test
```

## Useful links

Google Go client examples: https://github.com/googleapis/google-api-go-client/tree/master/examples
