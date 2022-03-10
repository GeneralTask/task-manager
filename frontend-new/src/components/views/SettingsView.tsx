import React, { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { Pressable } from 'react-native'
import styled from 'styled-components/native'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { SectionHeader } from '../molecules/Header'
import { Picker } from '@react-native-picker/picker';
import { useGetSupportedTypesQuery, useGetLinkedAccountsQuery } from '../../services/generalTaskApi'

const SettingsViewContainer = styled.View`
    flex: 1;
    margin-right: 7.5%;
    margin-left: 7.5%;
    margin-top: ${Spacing.margin.large}px;
`
const AccountsContainer = styled.View`
`
const SettingsView = () => {
    const [selectedType, setSelectedType] = useState()
    const { data: types } = useGetSupportedTypesQuery()
    const { data: linkedAccounts } = useGetLinkedAccountsQuery()

    console.log(linkedAccounts)
    const openAuthWindow = () => {
        if (!types) return
        for (const type of types) {
            if (type.name === selectedType) {
                const win = window.open(type.authorization_url, type.name, 'height=640,width=960,toolbar=no,menubar=no,scrollbars=no,location=no,status=no')
                if (win != null) {
                    const timer = setInterval(() => {
                        if (win.closed) {
                            clearInterval(timer)
                        }
                    }, 10)
                }
            }
        }
    }

    useEffect(() => {
        openAuthWindow()
    }, [selectedType])

    return (
        <SettingsViewContainer>
            <SectionHeader section="Settings" allowRefresh={false} />
            <AccountsContainer>
                <Picker
                    selectedValue={selectedType}
                    onValueChange={(itemValue) =>
                        setSelectedType(itemValue)
                    }>
                    <Picker.Item label="Add new account" value="add" />
                    {
                        types?.map(type => (
                            <Picker.Item key={type.name} label={type.name} value={type.name} />
                        ))
                    }
                </Picker>
            </AccountsContainer>
        </SettingsViewContainer>
    )
}

export default SettingsView
