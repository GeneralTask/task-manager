# Adapted from https://codefresh.io/docs/docs/learn-by-example/golang/golang-hello-world/
FROM golang:1.15-alpine AS build_base

RUN apk add --no-cache git

# [temporary] Install mongo DB shell
# https://stackoverflow.com/questions/59762376/issue-installing-mongodb-on-alpine-image
# RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/main' >> /etc/apk/repositories
# RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/community' >> /etc/apk/repositories
# RUN apk update &&  apk --no-cache --update add openjdk11 && apk --no-cache --update add mongodb
# RUN apk --update add mongodb-tools

# [temporary] Install python/pip
# https://stackoverflow.com/questions/62554991/how-do-i-install-python-on-alpine-linux
# ENV PYTHONUNBUFFERED=1
# RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
# RUN python3 -m ensurepip
# RUN pip3 install --no-cache --upgrade pip setuptools

# Add ca-certificates
RUN apk update \
    && apk upgrade \
    && apk add --no-cache \
    ca-certificates \
    && update-ca-certificates 2>/dev/null || true

# Set the Current Working Directory inside the container
WORKDIR /tmp/backend

# We want to populate the module cache based on the go.{mod,sum} files.
COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

# Not running unit tests here because unit tests require mongo DB running

# Build the Go app
RUN go build -o ./out/backend .

# Start fresh from a smaller image
FROM alpine:3.9 
RUN apk add ca-certificates

COPY --from=build_base /tmp/backend/out/backend /app/backend
COPY credentials.json /app/

# This container exposes port 8080 to the outside world
EXPOSE 8080

# Run the binary program produced by `go install`
WORKDIR /app
CMD ["./backend"]
