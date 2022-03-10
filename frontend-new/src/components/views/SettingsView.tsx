import React from 'react'
import styled from 'styled-components/native'
import { Spacing } from '../../styles'
import { SectionHeader } from '../molecules/Header'

const SettingsViewContainer = styled.View`
    flex: 1;
`
const HeaderContainer = styled.View`
    margin-right: 7.5%;
    margin-left: 7.5%;
    margin-top: ${Spacing.margin.large}px;
`
const AccountsContainer = styled.View`
`
const AccountsHeader = styled.Text`
`
const SettingsView = () => {
    return (
        <SettingsViewContainer>
            <HeaderContainer>
                <SectionHeader section="Settings" allowRefresh={false} />
            </HeaderContainer>
            <AccountsContainer>
                <AccountsHeader>Accounts</AccountsHeader>
            </AccountsContainer>
        </SettingsViewContainer>
    )
}

export default SettingsView
