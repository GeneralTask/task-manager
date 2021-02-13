// Source adapted from: https://developers.google.com/identity/sign-in/web/server-side-flow
function signInCallback(authResult) {
    if (authResult['code']) {

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
              contentType: 'application/json; charset=utf-8',
              success: function(result) {
                  // Handle or verify the server response.
                  console.log("Authenticated!")
              },
              processData: false,
              data: authResult['code'] // See documentation in Network.OAuth.OAuth2
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
