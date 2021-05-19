import React from 'react'
import {Link} from 'react-router-dom'
import { LANDING_PATH, SETTINGS_PATH } from '../constants'
import Cookies from 'js-cookie'

const Header = () => {
    return(
        <div className="header">
            <Link to={LANDING_PATH}>Tasks</Link>
            <Link to={SETTINGS_PATH}>Settings</Link>
            <button className="logout-btn" onClick={logout} disabled={!Cookies.get('authToken')}>Logout</button>
        </div>
    )
}


// This invalidates the cookie on the frontend
// We'll probably want to set up a more robust logout involving the backend
const logout = (e) => {
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.location.href = LANDING_PATH;
}

export default Header;
