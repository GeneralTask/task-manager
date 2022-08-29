- [task-manager](#task-manager)
  - [Frontend testing](#frontend-testing)
  - [Pre-Commit](#pre-commit)
  - [Backend setup](#backend-setup)
  - [Backend testing](#backend-testing)
    - [Running Tests in IDE](#running-tests-in-ide)
  - [Deploying backend](#deploying-backend)
    - [One-time Kubernetes setup](#one-time-kubernetes-setup)
    - [Interacting with the Kubernetes clusters](#interacting-with-the-kubernetes-clusters)
      - [Common Commands](#common-commands)
  - [Documentation updates](#documentation-updates)
  - [Debugging backend](#debugging-backend)
  - [Working with Slack](#working-with-slack)
    - [How to link to local Slack App](#how-to-link-to-local-slack-app)
    - [How to get new Slack tasks to local server](#how-to-get-new-slack-tasks-to-local-server)
  - [Useful links](#useful-links)

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

When running `yarn install`, you may see the following error:
```
error An unexpected error occurred: "https://npm.fontawesome.com/@fortawesome/pro-light-svg-icons/-/6.1.2/pro-light-svg-icons-6.1.2.tgz: Request failed \"401 Unauthorized\"".
```

This means you need the font awesome API keys. Please reach out to your mentor to get access to those keys. You will need to these commands:

```
npm config set "@fortawesome:registry" https://npm.fontawesome.com/
npm config set "//npm.fontawesome.com/:_authToken" [AUTH TOKEN HERE]
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

### Live-reloading / auto-recompile [highly recommended for devx]

We can setup the server to rebuild/rerun upon local file changes using [air](https://github.com/cosmtrek/air) so you don't have to constantly kill the server and rerun it yourself.

### Controlling log level

We can control the log level by setting the environment variable `LOG_LEVEL` (e.g. `info`, `debug`, etc) (which will override the setting in `.env`).

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
Our backend is currently on AWS EKS in us-west-1 region. These are the steps to setup access
We currently perform backend deploys using the Heroku CLI. Assuming you have the heroku credentials, you can deploy with the following steps:

### One-time Kubernetes setup

Add the appropriate group (`prd-gtsk-uswest1-full-access-group`) to your iamrole: https://github.com/GeneralTask/task-manager/blob/630b25b858baeeb0e4a0f775b7e5e96a490022c9/kubernetes/manifests/prod/prd-auth-config.yaml#L29-L32 and have a General Task admin apply the changes to the prod k8s cluster. Alternatively, adding these changes to the file above, and merging those changes into master will apply these changes as well (the credentials will be automatically added by AWS CodeBuild CI after landing the change).

Update your AWS access credentials. You can find your AWS credentials by logging into the console, and access your profile's security credentials. Generate some Access Credentials for your account, and place them into `~/.aws/credentials`. The format will look like so:

```
[default]
aws_access_key_id=<access key>
aws_secret_access_key=<secret>
```

Save the following snippet to your bashrc:
```
klogin () {
    export $(printf "AWS_ACCESS_KEY_ID=%s AWS_SECRET_ACCESS_KEY=%s AWS_SESSION_TOKEN=%s" \
    $(aws sts assume-role \
    --role-arn arn:aws:iam::257821106339:role/glb-gtsk-eks-full-access \
    --role-session-name glb-gtsk-eks-full-access \
    --query "Credentials.[AccessKeyId,SecretAccessKey,SessionToken]" \
    --output text))
}
```

Run `klogin`, and your credentials should be updated to include the access for Kubernetes.

Now, locally on your laptop, run:

```
aws --profile kube-config eks update-kubeconfig --region us-west-1 --name prd-gtsk-uswest1-backend
```

which will add the the profile to your `~/.kube/config`. You can also change the alias for this context/cluster by modifying the relevant part in `~/.kube/config` after you run this command to:

```
contexts:
- context:
    cluster: arn:aws:eks:us-west-1:257821106339:cluster/prd-gtsk-uswest1-backend
    namespace: prd-gtsk-uswest1
    user: arn:aws:eks:us-west-1:257821106339:cluster/prd-gtsk-uswest1-backend
  name: prod
```

### Interacting with the Kubernetes clusters

To test your configuration, run the following command to make sure your access permissions are correct and to verify the cluster connectivity: `kubectl get svc`, and you should see something like:

```
➜ kubectl get svc                                        09:26:00
Alias tip: k get svc
NAME           TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
core-service   NodePort   172.19.64.51   <none>        8080:31254/TCP   21d
```

#### Common Commands
Here's a list of nice k8s commands to add to your shell file:
```
alias kp="kubectl config use-context prod --namespace prd-gtsk-uswest1"
alias kgp="kubectl get pods"
alias kgd="kubectl get deployments"
alias kroll="kubectl rollout restart deployment/core-deployment"
ksh() {
    kubectl exec -it $1 -- "/bin/sh"
}
kdlogs() {
    kubectl logs -f deployment/core-deployment --all-containers=true --since=10m
}
kdl() {
    stern core-deployment -t --since 10m
}
```

Here are a few common interactions:
* Select context & namespace, run `kp`
* List pods, run `kgp`; list deployments, run `kgd`
* SSH to a pod, run `ksh <pod name>` - for example: `ksh core-deployment-756d697659-hqgk4`
* View logs for a specific pod `k logs core-deployment-756d697659-hqgk4`
* View collated logs for the whole deployment with `kdlogs` or `kdl` (for the latter, you need to install [`stern`](https://github.com/wercker/stern))


## Documentation updates

We are in the process of migrating our documentation over to Swagger. In order to use Swagger, simply run the go server (via air or otherwise), and access [localhost:8080/swagger](localhost:8080/swagger). This will redirect you to the correct page.

If you are updating the documentation in any way, you should run:
`swag init`

This will update the documentation, and generate the required files to get the UI to update as well.

## Debugging backend

In development, we run Mongo Express at http://localhost:8081/ . Mongo Express is a web GUI which makes the local MongoDB instance available to explore and can be useful for debugging. Backend logs are available in the terminal window running the local go server.

In production, it is possible to use `heroku logs` to view the production application logs.

## Working with Slack

The Slack integration has some nuances which prevent local linking from the same App. Thus, we have 2 different Slack apps we use, one for local development, and one for production. They should behave in exactly the same way, except that one points to our local instances, and one points towards our prod servers.

### How to link to local Slack App

First, make sure you have the correct environment variables set. You will need both the `SLACK_OAUTH_CLIENT_SECRET` and `SLACK_SIGNING_SECRET` secrets. You can find both of these in the Basic Information section in the [Slack developer console](https://api.slack.com).

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
