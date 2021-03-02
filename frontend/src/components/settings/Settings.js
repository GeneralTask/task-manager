import React from 'react'
import "./Settings.css"
import Account from "./Account"
import {JIRAURL} from "../../constants"

function Settings(){
    return(
        <div>
            <div className="settings-page-header">
                <h1>Settings</h1>
            </div>
            <div className="settings-body">
                <h2>Accounts</h2>
                <Account logo="images/jira.svg" name="Jira" link={JIRAURL} />
            </div>
        </div>
    )
}

export default Settings;
