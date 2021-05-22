#!/bin/bash

go clean -testcache
export DB_NAME=test
go test -cover -v ./...
if [ $? -eq 0 ]
then
    echo "Tests succeeded!"
    unset DB_NAME
    exit 0
else
    echo "Tests failed!"
    unset DB_NAME
    exit 1
fi
