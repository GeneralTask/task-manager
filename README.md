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

We can setup the server to rebuild/rerun upon local file changes using [air](https://github.com/cosmtrek/air) and also control the log level by setting the environment variable `LOG_LEVEL` (e.g. `info`, `debug`, etc) (which will override the setting in `.env`).

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

## Debugging backend

In development, we run Mongo Express at http://localhost:8081/ . Mongo Express is a web GUI which makes the local MongoDB instance available to explore and can be useful for debugging. Backend logs are available in the terminal window running the local go server.

In production, it is possible to use `heroku logs` to view the production application logs.

## Working with Slack

The Slack integration has some nuances which prevent local linking from the same App. Thus, we have 2 different Slack apps we use, one for local development, and one for production. They should behave in exactly the same way, except that one points to our local instances, and one points towards our prod servers.

### How to link to local Slack App

Linking to the local Slack App requires a number of additional steps, as Slack does not allow for interactions with localhost addresses. Thus, we must take the following steps:

- Use ngrok to allow forwarding of our localhost to the internet: `ngrok http 8080`
- Input your current ngrok url to the [Slack app as an acceptable callback](https://api.slack.com/apps/A03NMQNKUF2/oauth?) 
- Change your SERVER_URL in the .env file (in the backend directory) to match this ngrok URL

Then, go to your localhost, and link as you would any other app. This should get you to a dialogue window, accept the terms, and you will be redirected to a URL beginning with ngrok-...

This request will fail. This is due to the fact that the cookies are localhost specific, and the browser does not know that ngrok-... and localhost are the same. Thus:

- Copy the URL from the popup, and paste it in a new tab (as most browsers do not allow for editing URLs in popups). Replace the beginning of the URL with localhost:8080. This should redirect you to the correct page, and you should see `Success`. This means that the linking was successful.

### How to get new Slack tasks to local server

Once the App has been linked to your account locally, it will continue to be linked unless the DB is nuked. In order to use this account to test, all that is required is to spin up an instance of `ngrok http 8080`, and then input the URL `https://ngrok...io/tasks/create_external/slack/` [here as the request URL](https://api.slack.com/apps/A03NMQNKUF2/interactive-messages?).

## Useful links

Google Go client examples: https://github.com/googleapis/google-api-go-client/tree/master/examples
