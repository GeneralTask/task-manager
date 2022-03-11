import React, { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Pressable } from 'react-native'
import styled from 'styled-components/native'
import { Border, Colors, Spacing } from '../../styles'
import { logos } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { SectionHeader } from '../molecules/Header'
import { Picker } from '@react-native-picker/picker';
import { useGetSupportedTypesQuery, useGetLinkedAccountsQuery, useDeleteLinkedAccountMutation } from '../../services/generalTaskApi'
import TaskTemplate from '../atoms/TaskTemplate'

const SettingsViewContainer = styled.View`
    flex: 1;
    margin-right: 7.5%;
    margin-left: 7.5%;
    margin-top: ${Spacing.margin.large}px;
`
const AccountsContainer = styled.View`
    margin-top: ${Spacing.margin.medium}px;
`
const AccountSpacing = styled.View`
    margin-top: ${Spacing.margin.medium}px;
`
const AccountContainer = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
    background-color: ${Colors.white};
    border-radius: ${Border.radius.large};
    height: 100%;
`
const IconContainer = styled.View`
    margin-left: ${Spacing.margin.medium}px;
    margin-right: ${Spacing.margin.medium}px;
`
const UnlinkContainer = styled.View`
    margin-left: auto;
    margin-right: ${Spacing.margin.medium}px;
    padding-left: 100;
    background-color: ${Colors.gray._100};
    border-radius: ${Border.radius.small};
    padding: ${Spacing.padding.xSmall}px ${Spacing.padding.small}px;
`
const UnlinkButton = styled.Pressable`
    background-color: ${Colors.gray._100};
`
const SettingsView = () => {
    const [selectedType, setSelectedType] = useState<string>()
    const { data: types } = useGetSupportedTypesQuery()
    const { data: linkedAccounts, refetch } = useGetLinkedAccountsQuery()
    const [deleteAccount] = useDeleteLinkedAccountMutation()

    const openAuthWindow = () => {
        if (!types) return
        for (const type of types) {
            if (type.name === selectedType) {
                const win = window.open(
                    type.authorization_url,
                    type.name,
                    'height=640,width=960,toolbar=no,menubar=no,scrollbars=no,location=no,status=no'
                )
                if (win != null) {
                    const timer = setInterval(() => {
                        if (win.closed) {
                            clearInterval(timer)
                            setSelectedType('add')
                            refetch()
                        }
                    }, 10)
                }
            }
        }
    }
    const onUnlink = (id: string) => deleteAccount({ id: id })
    useEffect(openAuthWindow, [selectedType])

    return (
        <ScrollView>
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
                <View>
                    {
                        linkedAccounts?.map(account => (
                            <AccountSpacing key={account.id}>
                                <TaskTemplate>
                                    <AccountContainer >
                                        <IconContainer>
                                            <Icon size="small" source={logos[account.logo_v2]}></Icon>
                                        </IconContainer>
                                        <Text>{account.display_id}</Text>
                                        {account.is_unlinkable && (
                                            <UnlinkContainer>
                                                <UnlinkButton onPress={() => onUnlink(account.id)} >
                                                    <Text>Remove link</Text>
                                                </UnlinkButton>
                                            </UnlinkContainer>
                                        )}
                                    </AccountContainer>
                                </TaskTemplate>
                            </AccountSpacing>
                        ))
                    }
                </View>
            </SettingsViewContainer>
        </ScrollView>
    )
}

export default SettingsView
