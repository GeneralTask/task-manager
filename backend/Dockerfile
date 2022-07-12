# Adapted from https://codefresh.io/docs/docs/learn-by-example/golang/golang-hello-world/
FROM golang:1.18-alpine AS build_base

RUN apk add --no-cache git

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
COPY .env /app/
ADD migrations /app/migrations/

# This container exposes port 8080 to the outside world
EXPOSE 8080

# Run the binary program produced by `go install`
WORKDIR /app
CMD ["./backend"]
