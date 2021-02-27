import React from 'react'
import "./Settings.css"
import Account from "./Account"

function Settings(){
    return(
        <div>
            <div className="settings-page-header">
                <h1>Settings</h1>
            </div>
            <div className="settings-body">
                <h2>Accounts</h2>
                {/* will need real links for most of these */}
                <Account logo="images/google.svg" name="Google" link="https://google.com" />
                <Account logo="images/jira.svg" name="Jira" link="https://jira.com" />
                <Account logo="images/outlook-logo.png" name="Outlook" link="https://outlook.com" />
                <Account logo="images/slack-logo-icon.png" name="Slack" link="https://slack.com" />
                <Account logo="images/asana-logo.png" name="Asana" link="https://asana.com" />
                <Account logo="images/zoom.svg" name="Zoom" link="https://zoom.us" />
            </div>
        </div>
    )
}

export default Settings;