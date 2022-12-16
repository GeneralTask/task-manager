curl -sfL https://raw.githubusercontent.com/securego/gosec/master/install.sh | sh -s -- -b $(go env GOPATH)/bin v2.14.0
gosec -r
if [ $? -eq 0 ]
then
    echo "Test succeeded!"
    exit 0
else
    echo "Test failed!"
    exit 1
fi