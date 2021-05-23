import React from 'react'
import Account from './Account'
import Preferences from './Preferences'
import { JIRA_URL } from '../../constants'
import styled from 'styled-components'

const Header = styled.div`
    text-align: center;
`

const Body = styled.div`
    width: 35%;
    margin: auto;
`

const Setting = styled.div`
    margin-top: 20px;
    margin-bottom: 20px;
`

const Settings: React.FC = () => {
    return (
        <div>
            <Header>
                <h1>Settings</h1>
            </Header>
            <Setting>
                <Body>
                    <h2>Accounts</h2>
                    <Account logo="/images/jira.svg" name="Jira" link={JIRA_URL} />
                </Body>
            </Setting>
            <Setting>
                <Body>
                    <Preferences/>
                </Body>
            </Setting>
        </div>
    )
}

export default Settings
