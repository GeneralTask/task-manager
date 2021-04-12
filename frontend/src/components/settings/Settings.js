import React from 'react'
import "./Settings.css"
import Account from "./Account"
import {JIRA_URL, REACT_APP_FRONTEND_BASE_URL} from "../../constants"

function Settings(){
    return(
        <div>
            <div className="settings-page-header">
                <h1>Settings</h1>
            </div>
            <div className="settings-body">
                <h2>Accounts</h2>
                <Account logo={REACT_APP_FRONTEND_BASE_URL + "/images/jira.svg"} name="Jira" link={JIRA_URL} />
            </div>
        </div>
    )
}

export default Settings;
