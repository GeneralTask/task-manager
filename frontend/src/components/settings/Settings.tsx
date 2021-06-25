import React from 'react'
import Preferences from './Preferences'
import styled from 'styled-components'
import Accounts from './Accounts'
import { device, flex } from '../../helpers/styles'
import AddNewAccountDropdown from './AddNewAccountDropdown'

const Header = styled.div`
    text-align: center; 
`

const Body = styled.div`
    width: 90%;
    margin: auto;
 
    @media ${device.tablet} {
        width: 50%;
    }

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
        <div>
            <Header>
                <h1>Settings</h1>
            </Header>
            <Setting>
                <Body>
                    <flex.justifyContentSpaceBetween>
                        <h2>Accounts</h2>
                        <AddNewAccountDropdown />
                    </flex.justifyContentSpaceBetween>
                    <Accounts />
                </Body>
            </Setting>
            <Setting>
                <Body>
                    <Preferences />
                </Body>
            </Setting>
        </div>
    )
}

export default Settings
