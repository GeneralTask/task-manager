import React from 'react'

function Header(){
    return(
        <div className="header">
            <button className="logout-btn" onClick={logout} >Logout</button>
        </div>
    )
}


// This invalidates the cookie on the frontend
// We'll probably want to set up a more robust logout involving the backend
function logout(e){
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.location.reload();
}

export default Header;
