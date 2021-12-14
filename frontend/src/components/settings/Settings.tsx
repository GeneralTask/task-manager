import { device } from '../../helpers/styles'

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
    width: 100%;
    overflow: scroll;
    padding-top: 50px;
`
const Header = styled.div`
    text-align: center;
    font-size: 32px; 
    margin-bottom: 24px;
`

const Body = styled.div`
    width: 50%;
    margin: auto;

    @media ${device.laptop} {
        width: 35%;
    }
`

const Setting = styled.div`
    margin-top: 20px;
    margin-bottom: 20px;
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
                    <Body>
                        <Accounts />
                    </Body>
                </Setting>
                <Setting>
                    <Body>
                        <Preferences />
                    </Body>
                </Setting>
            </SettingsContentContainer>
        </SettingsPageContainer>
    )
}

export default Settings
