#!/bin/bash

export DB_NAME=test
go test -v ./...
unset DB_NAME
