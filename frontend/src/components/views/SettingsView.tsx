import { Border, Colors, Spacing } from '../../styles'
import React, { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useDeleteLinkedAccount, useGetLinkedAccounts, useGetSupportedTypes } from '../../services/api-query-hooks'

import { Icon } from '../atoms/Icon'
import { Picker } from '@react-native-picker/picker'
import { SectionHeader } from '../molecules/Header'
import TaskTemplate from '../atoms/TaskTemplate'
import { logos } from '../../styles/images'
import styled from 'styled-components/native'

const SettingsViewContainer = styled.View`
    flex: 1;
    margin-right: 7.5%;
    margin-left: 7.5%;
    margin-top: ${Spacing.margin._24}px;
`
const AccountsContainer = styled.View`
    margin-top: ${Spacing.margin._16}px;
`
const AccountSpacing = styled.View`
    margin-top: ${Spacing.margin._16}px;
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
    margin-left: ${Spacing.margin._16}px;
    margin-right: ${Spacing.margin._16}px;
`
const UnlinkContainer = styled.View`
    margin-left: auto;
    margin-right: ${Spacing.margin._16}px;
    padding-left: 100px;
    background-color: ${Colors.gray._100};
    border-radius: ${Border.radius.small};
    padding: ${Spacing.padding.xSmall}px ${Spacing.padding.small}px;
`
const UnlinkButton = styled.Pressable`
    background-color: ${Colors.gray._100};
`
const SettingsView = () => {
    const [selectedType, setSelectedType] = useState<string>()
    const { data: supportedTypes } = useGetSupportedTypes()
    const { data: linkedAccounts, refetch } = useGetLinkedAccounts()
    const { mutate: deleteAccount } = useDeleteLinkedAccount()

    const openAuthWindow = () => {
        if (!supportedTypes) return
        for (const type of supportedTypes) {
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
                <SectionHeader sectionName="Settings" allowRefresh={false} />
                <AccountsContainer>
                    <Picker selectedValue={selectedType} onValueChange={(itemValue) => setSelectedType(itemValue)}>
                        <Picker.Item label="Add new account" value="add" />
                        {supportedTypes?.map((type, i) => (
                            <Picker.Item key={i} label={type.name} value={type.name} />
                        ))}
                    </Picker>
                </AccountsContainer>
                <View>
                    {linkedAccounts?.map((account) => (
                        <AccountSpacing key={account.id}>
                            <TaskTemplate>
                                <AccountContainer>
                                    <IconContainer>
                                        <Icon size="small" source={logos[account.logo_v2]}></Icon>
                                    </IconContainer>
                                    <Text>{account.display_id}</Text>
                                    {account.is_unlinkable && (
                                        <UnlinkContainer>
                                            <UnlinkButton onPress={() => onUnlink(account.id)}>
                                                <Text>Remove link</Text>
                                            </UnlinkButton>
                                        </UnlinkContainer>
                                    )}
                                </AccountContainer>
                            </TaskTemplate>
                        </AccountSpacing>
                    ))}
                </View>
            </SettingsViewContainer>
        </ScrollView>
    )
}

export default SettingsView
