import React from 'react'
import Account from "./Account"
import {JIRA_URL} from "../../constants"
import styled from "styled-components"

const Header = styled.div`
    height: 100px;
    width: 100%;
    margin: auto;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const Body = styled.div`
    width: 30%;
    margin: auto;
`;

const Settings = () => {
    return(
        <div>
            <Header>
                <h1>Settings</h1>
            </Header>
            <Body>
                <h2>Accounts</h2>
                <Account logo="/images/jira.svg" name="Jira" link={JIRA_URL} />
            </Body>
        </div>
    )
}

export default Settings;
