// Source adapted from: https://developers.google.com/identity/sign-in/web/server-side-flow
function signInCallback(authResult) {
    if (authResult['code']) {

        console.log("Got code", authResult)

        // Hide the sign-in button now that the user is authorized, for example:
        $('#signinButton').attr('style', 'display: none');

        alert(JSON.stringify(authResult['code']))

        fetch('/login/authorize', {
            method: 'POST',
            body: JSON.stringify(authResult['code']),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        }).then (response => window.location.replace("/app"))
    } else {
        // There was an error.
        console.warn("error authenticating user", authResult)
    }
}

// Source: https://developers.google.com/identity/sign-in/web/server-side-flow
$('#signinButton').click(function() {
    auth2.grantOfflineAccess().then(signInCallback);
});
