// Source adapted from: https://developers.google.com/identity/sign-in/web/server-side-flow
function signInCallback(authResult) {
    if (authResult['code']) {

        console.log("Got code", authResult)

        // Hide the sign-in button now that the user is authorized, for example:
        $('#signinButton').attr('style', 'display: none');


        // Send the code to the server
        $.ajax({
            type: 'POST',
            url: '/login/authorize',
            // Always include an `X-Requested-With` header in every AJAX request,
            // to protect against CSRF attacks.
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            contentType: "application/json",
            dataType: 'json',
            success: function(result) {
                // Handle or verify the server response.
                console.log("Authenticated!")

                // Redirect to app.
                window.location.href = "/app"
            },
            data: JSON.stringify(authResult['code']), // See documentation in Network.OAuth.OAuth2
            error: function (xhr, status, error) {
                console.warn("Error", xhr, status, error)
            }
        });
    } else {
        // There was an error.
        console.warn("error authenticating user", authResult)
    }
}

// Source: https://developers.google.com/identity/sign-in/web/server-side-flow
$('#signinButton').click(function() {
    auth2.grantOfflineAccess().then(signInCallback);
});
