# task-manager

A manager of tasks.

## Frontend testing

First, install node.
Then, install yarn: `npm install -g yarn` (can use brew too)

```
cd frontend
yarn install
yarn start
```

## Pre-Commit

Install pre-commit by

```
brew install pre-commit
```

Then inside of the `task-manager` directory add pre-commit to the project using:

```
pre-commit install
```

## Backend setup

First, install Go and Docker. Ensure that your version of Go appropriately matches your computer operating system and architecture.

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

We can setup the server to rebuild/rerun upon local file changes using [air](https://github.com/cosmtrek/air) and also control the log level by setting the environment variable `LOG_LEVEL` (e.g. `info`, `debug`, etc).

## Backend testing

```
cd backend
docker-compose up -d
./runtests.sh
```

To clear the test cache:

```
go clean -testcache
```

### Running Tests in IDE
To run tests through VS Code, put the following snippet in your `settings.json`:
```
    "go.testEnvVars": {
        "DB_NAME": "test"
    },
```

To run tests through GoLand, go to `Run | Edit Configurations` and then add a new `Go Test` configuration with `DB_NAME=test`

## Deploying backend

We currently perform backend deploys using the Heroku CLI. Assuming you have the heroku credentials, you can deploy with the following steps:

```
# get on latest master branch
heroku login
git push heroku master
```

## Documentation updates

We are in the process of migrating our documentation over to Swagger. In order to use Swagger, simply run the go server (via air or otherwise), and access [localhost:8080/swagger](localhost:8080/swagger). This will redirect you to the correct page.

If you are updating the documentation in any way, you should run:
`swag init`

This will update the documentation, and generate the required files to get the UI to update as well.

## Debugging backend

In development, we run Mongo Express at http://localhost:8081/ . Mongo Express is a web GUI which makes the local MongoDB instance available to explore and can be useful for debugging. Backend logs are available in the terminal window running the local go server.

In production, it is possible to use `heroku logs` to view the production application logs.

## Useful links

Google Go client examples: https://github.com/googleapis/google-api-go-client/tree/master/examples
