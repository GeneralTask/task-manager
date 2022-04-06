import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { useDeleteLinkedAccount, useGetLinkedAccounts, useGetSupportedTypes } from '../../services/api-query-hooks'
import { Icon } from '../atoms/Icon'
import { SectionHeader } from '../molecules/Header'
import TaskTemplate from '../atoms/TaskTemplate'
import { logos } from '../../styles/images'

const AUTH_WINDOW_WIDTH = 960
const AUTH_WINDOW_HEIGHT = 640
const ScrollViewMimic = styled.div`
    margin: 40px 10px 100px 10px;
    flex: 1;
`
const SettingsViewContainer = styled.div`
    font-family: Switzer-Variable;
`
const AccountsContainer = styled.div`
    margin-top: ${Spacing.margin._16}px;
`
const AccountSpacing = styled.div`
    margin-top: ${Spacing.margin._16}px;
`
const AccountContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    background-color: ${Colors.white};
    border-radius: ${Border.radius.large};
    height: 100%;
`
const IconContainer = styled.div`
    margin-left: ${Spacing.margin._16}px;
    margin-right: ${Spacing.margin._16}px;
`
const UnlinkContainer = styled.div`
    margin-left: auto;
    margin-right: ${Spacing.margin._16}px;
    padding-left: 100px;
    background-color: ${Colors.gray._100};
    border-radius: ${Border.radius.small};
    padding: ${Spacing.padding._4}px ${Spacing.padding._8}px;
`
const XSmallFontSpan = styled.span`
    font-size: ${Typography.xSmall.fontSize};
`
const FullWidthSelect = styled.select`
    width: 100%;
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
                const left = (screen.width - AUTH_WINDOW_WIDTH) / 2;
                const top = (screen.height - AUTH_WINDOW_HEIGHT) / 4;
                const win = window.open(
                    type.authorization_url,
                    type.name,
                    `height=${AUTH_WINDOW_HEIGHT},width=${AUTH_WINDOW_WIDTH},top=${top},left=${left}toolbar=no,menubar=no,scrollbars=no,location=no,status=no`
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
    useEffect(() => {
        openAuthWindow()
        setSelectedType('add')
    }, [selectedType])

    return (
        <ScrollViewMimic>
            <SettingsViewContainer>
                <SectionHeader sectionName="Settings" allowRefresh={false} />
                <AccountsContainer>
                    <FullWidthSelect value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                        <option value="add" >Add new account</option>
                        {supportedTypes?.map((type, i) => (
                            <option key={i} value={type.name}>{type.name}</option>
                        ))}
                    </FullWidthSelect>
                </AccountsContainer>
                {linkedAccounts?.map((account) => (
                    <AccountSpacing key={account.id}>
                        <TaskTemplate>
                            <AccountContainer>
                                <IconContainer>
                                    <Icon size="small" source={logos[account.logo_v2]}></Icon>
                                </IconContainer>
                                <XSmallFontSpan>{account.display_id}</XSmallFontSpan>
                                {account.is_unlinkable && (
                                    <UnlinkContainer>
                                        <NoStyleButton onClick={() => onUnlink(account.id)}>
                                            <XSmallFontSpan>Remove link</XSmallFontSpan>
                                        </NoStyleButton>
                                    </UnlinkContainer>
                                )}
                            </AccountContainer>
                        </TaskTemplate>
                    </AccountSpacing>
                ))}
            </SettingsViewContainer>
        </ScrollViewMimic>

    )
}

export default SettingsView
