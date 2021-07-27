import { device, flex } from '../../helpers/styles'

import Accounts from './Accounts'
import AddNewAccountDropdown from './AddNewAccountDropdown'
import Preferences from './Preferences'
import React from 'react'
import styled from 'styled-components'

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
        <div>
            <Header>
                Settings
            </Header>
            <Setting>
                <Body>
                    <flex.centerXY>
                        <h2>Accounts</h2>
                        <AddNewAccountDropdown />
                    </flex.centerXY>
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
