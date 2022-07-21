import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { useDeleteLinkedAccount, useGetLinkedAccounts, useGetSupportedTypes } from '../../services/api/settings.hooks'
import { Icon } from '../atoms/Icon'
import { SectionHeader } from '../molecules/Header'
import TaskTemplate from '../atoms/TaskTemplate'
import { logos } from '../../styles/images'
import { openAuthWindow } from '../../utils/auth'
import { DEFAULT_VIEW_WIDTH } from '../../styles/dimensions'
import { GoogleSignInButtonImage, signInWithGoogleButtonDimensions } from '../atoms/buttons/GoogleSignInButton'
import GTSelect from '../molecules/GTSelect'
import GTButton from '../atoms/buttons/GTButton'

const ScrollViewMimic = styled.div`
    margin: 40px 10px 100px 10px;
    flex: 1;
`
const SettingsViewContainer = styled.div`
    min-width: ${DEFAULT_VIEW_WIDTH};
`
const AccountsContainer = styled.div`
    margin-top: ${Spacing.margin._16};
`
const AccountSpacing = styled.div`
    margin-top: ${Spacing.margin._16};
`
const AccountContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.large};
    height: 100%;
`
const IconContainer = styled.div`
    margin-left: ${Spacing.margin._16};
    margin-right: ${Spacing.margin._16};
`
const AccountButtonContainer = styled.div<{ important?: boolean }>`
    margin-right: ${Spacing.margin._16};
    background-color: ${(props) => (props.important ? Colors.status.red.light : Colors.background.mid)};
    outline: 1px solid ${(props) => (props.important ? Colors.status.red.default : Colors.background.mid)};
    color: ${Colors.text.black};
    border-radius: ${Border.radius.small};
    padding: ${Spacing.padding._4} ${Spacing.padding._8};
    min-width: fit-content;
`
const XSmallFontSpan = styled.span`
    font-size: ${Typography.xSmall.fontSize};
    margin-right: auto;
`
const FullWidth = styled.div`
    display: flex;
    justify-content: end;
    margin-right: ${Spacing.margin._16};
`
const ShowLinkAccountsButtonContainer = styled.div`
    width: ${signInWithGoogleButtonDimensions.width};
    display: flex;
    flex-direction: column;
`
const TextAlignCenter = styled.span`
    text-align: center;
    width: 100%;
`

const SettingsView = () => {
    const [showLinkAccountsDropdown, setShowLinkedAccountsDropdown] = useState(false)
    const showLinkAccountsButtonContainerRef = useRef<HTMLDivElement>(null)

    const { data: supportedTypes } = useGetSupportedTypes()
    const { data: linkedAccounts, refetch } = useGetLinkedAccounts()
    const { mutate: deleteAccount } = useDeleteLinkedAccount()

    const onUnlink = (id: string) => deleteAccount({ id: id })
    const onRelink = (accountType: string) => supportedTypes && openAuthWindow(accountType, supportedTypes, refetch)

    return (
        <ScrollViewMimic>
            <SettingsViewContainer>
                <SectionHeader sectionName="Settings" allowRefresh={false} />
                <AccountsContainer>
                    <FullWidth>
                        <ShowLinkAccountsButtonContainer ref={showLinkAccountsButtonContainerRef}>
                            <GTButton
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowLinkedAccountsDropdown(!showLinkAccountsDropdown)
                                }}
                                value="Add new Account"
                                styleType="secondary"
                            />
                            {showLinkAccountsDropdown && (
                                <GTSelect
                                    options={
                                        supportedTypes?.map((type) => ({
                                            item:
                                                type.name === 'Google' ? (
                                                    GoogleSignInButtonImage
                                                ) : (
                                                    <TextAlignCenter>{type.name}</TextAlignCenter>
                                                ),
                                            onClick: () => openAuthWindow(type.name, supportedTypes, refetch),
                                            hasPadding: type.name !== 'Google',
                                        })) ?? []
                                    }
                                    location="left"
                                    onClose={() => setShowLinkedAccountsDropdown(false)}
                                    parentRef={showLinkAccountsButtonContainerRef}
                                />
                            )}
                        </ShowLinkAccountsButtonContainer>
                    </FullWidth>
                </AccountsContainer>
                {linkedAccounts?.map((account) => (
                    <AccountSpacing key={account.id}>
                        <TaskTemplate>
                            <AccountContainer>
                                <IconContainer>
                                    <Icon size="small" source={logos[account.logo_v2]}></Icon>
                                </IconContainer>
                                <XSmallFontSpan>{account.display_id}</XSmallFontSpan>
                                {account.has_bad_token && (
                                    <AccountButtonContainer important>
                                        <NoStyleButton onClick={() => onRelink(account.name)}>
                                            <XSmallFontSpan>Re-link Account</XSmallFontSpan>
                                        </NoStyleButton>
                                    </AccountButtonContainer>
                                )}
                                {account.is_unlinkable && (
                                    <AccountButtonContainer>
                                        <NoStyleButton onClick={() => onUnlink(account.id)}>
                                            <XSmallFontSpan>Remove link</XSmallFontSpan>
                                        </NoStyleButton>
                                    </AccountButtonContainer>
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
