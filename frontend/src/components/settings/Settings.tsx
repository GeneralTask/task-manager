import Accounts from './Accounts'
import Preferences from './Preferences'
import React from 'react'
import styled from 'styled-components'
import Navbar from '../Navbar'
import { NavbarPages } from '../../helpers/types'

const SettingsPageContainer = styled.div`
    display:flex;
    height: 100%;
`
const SettingsContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    overflow: scroll;
    padding-top: 50px;
    position: relative;
`
const Header = styled.div`
    font-size: 32px; 
    margin-bottom: 24px;
    width: 60%;
`
const Setting = styled.div`
    width: 60%;
    margin-top: 20px;
`

const Settings: React.FC = () => {
    return (
        <SettingsPageContainer>
            <Navbar currentPage={NavbarPages.SETTINGS_PAGE} />
            <SettingsContentContainer>
                <Header>
                    Settings
                </Header>
                <Setting>
                    <Accounts />
                </Setting>
                <Setting>
                    <Preferences />
                </Setting>
            </SettingsContentContainer>
        </SettingsPageContainer>
    )
}

export default Settings
