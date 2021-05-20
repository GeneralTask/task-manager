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

Next, if you need to test anything that requires credentials, such as Google OAuth flow, then you'll need to set appropriate environment variables with those values, for example:

```
export GOOGLE_OAUTH_CLIENT_SECRET=<secret here>
```

Then, you can run the following commands:

```
cd backend
docker-compose up -d
go run .

# Hit the API server
curl localhost:8080/ping
```

## Backend testing

```
cd backend
docker-compose up -d
go test -v ./...
```

## Deploying backend

We currently perform backend deploys using the Heroku CLI. Assuming you have the heroku credentials, you can deploy with the following steps:

```
# get on latest master branch
heroku login
git push heroku master
```

## Debugging backend

In development, we run Mongo Express at http://localhost:8081/ . Mongo Express is a web GUI which makes the local MongoDB instance available to explore and can be useful for debugging. Backend logs are available in the terminal window running the local go server.

In production, it is possible to use `heroku logs` to view the production application logs.

## Useful links

Google Go client examples: https://github.com/googleapis/google-api-go-client/tree/master/examples
