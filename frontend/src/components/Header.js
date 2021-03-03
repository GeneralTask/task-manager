import React from 'react'
import {Link} from 'react-router-dom'
import { TASKS_PATH, SETTINGS_PATH } from '../constants'

function Header(){
    return(
        <div className="header">
            <Link to={TASKS_PATH}>Tasks</Link>
            <Link to={SETTINGS_PATH}>Settings</Link>
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
