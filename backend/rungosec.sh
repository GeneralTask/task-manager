curl -sfL https://raw.githubusercontent.com/securego/gosec/master/install.sh | sh -s vX.Y.Z
gosec -r
if [ $? -eq 0 ]
then
    echo "Test succeeded!"
    exit 0
else
    echo "Test failed!"
    exit 1
fi