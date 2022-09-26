import styled from 'styled-components'
import useRefetchStaleQueries from '../../hooks/useRefetchStaleQueries'
import { useDeleteLinkedAccount, useGetLinkedAccounts, useGetSupportedTypes } from '../../services/api/settings.hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { DEFAULT_VIEW_WIDTH } from '../../styles/dimensions'
import { logos } from '../../styles/images'
import { openPopupWindow } from '../../utils/auth'
import { Icon } from '../atoms/Icon'
import Loading from '../atoms/Loading'
import TaskTemplate from '../atoms/TaskTemplate'
import GTButton from '../atoms/buttons/GTButton'
import GoogleSignInButton from '../atoms/buttons/GoogleSignInButton'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import { Header } from '../molecules/Header'
import SignOutButton from '../molecules/SignOutButton'
import GTDropdownMenu from '../radix/GTDropdownMenu'

const ScrollViewMimic = styled.div`
    margin: 40px 10px 100px 10px;
    flex: 1;
`
const SettingsViewContainer = styled.div`
    min-width: ${DEFAULT_VIEW_WIDTH};
`
const AccountsContainer = styled.div`
    margin-top: ${Spacing._16};
`
const AccountSpacing = styled.div`
    margin-top: ${Spacing._16};
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
    margin-left: ${Spacing._16};
    margin-right: ${Spacing._16};
`
const AccountButtonContainer = styled.div<{ important?: boolean }>`
    margin-right: ${Spacing._16};
    background-color: ${(props) => (props.important ? Colors.status.red.light : Colors.background.medium)};
    outline: 1px solid ${(props) => (props.important ? Colors.status.red.default : Colors.background.medium)};
    color: ${Colors.text.black};
    border-radius: ${Border.radius.small};
    padding: ${Spacing._4} ${Spacing._8};
    min-width: fit-content;
`
const AccountNameSpan = styled.span`
    margin-right: auto;
    ${Typography.bodySmall};
`
const FullWidth = styled.div`
    display: flex;
    justify-content: end;
    margin-right: ${Spacing._16};
`
const ShowLinkAccountsButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
`
const GapView = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._8};
`

const SettingsView = () => {
    const { data: supportedTypes } = useGetSupportedTypes()
    const { data: linkedAccounts } = useGetLinkedAccounts()
    const { mutate: deleteAccount } = useDeleteLinkedAccount()
    const refetchStaleQueries = useRefetchStaleQueries()

    const onUnlink = (id: string) => deleteAccount({ id: id })
    const onRelink = (accountType: string) => {
        if (!supportedTypes) return
        for (const type of supportedTypes) {
            if (type.name === accountType) {
                openPopupWindow(type.authorization_url, refetchStaleQueries)
                return
            }
        }
    }

    if (!supportedTypes || !linkedAccounts) return <Loading />

    const dropdownItems = supportedTypes
        .map((supportedType) => ({
            label: supportedType.name,
            onClick: () => openPopupWindow(supportedType.authorization_url, refetchStaleQueries),
            icon: supportedType.logo,
            renderer: supportedType.name === 'Google' ? GoogleSignInButton : undefined,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)) // so the order is always the same

    return (
        <ScrollViewMimic>
            <SettingsViewContainer>
                <Header name="Settings" />
                <AccountsContainer>
                    <FullWidth>
                        <GapView>
                            <ShowLinkAccountsButtonContainer>
                                <GTDropdownMenu
                                    items={dropdownItems}
                                    trigger={<GTButton value="Add new Account" styleType="primary" />}
                                />
                            </ShowLinkAccountsButtonContainer>
                            <SignOutButton />
                        </GapView>
                    </FullWidth>
                </AccountsContainer>
                {linkedAccounts?.map((account) => (
                    <AccountSpacing key={account.id}>
                        <TaskTemplate>
                            <AccountContainer>
                                <IconContainer>
                                    <Icon size="small" icon={logos[account.logo_v2]}></Icon>
                                </IconContainer>
                                <AccountNameSpan>{account.display_id}</AccountNameSpan>
                                {account.has_bad_token && (
                                    <AccountButtonContainer important>
                                        <NoStyleButton onClick={() => onRelink(account.name)}>
                                            <AccountNameSpan>Re-link Account</AccountNameSpan>
                                        </NoStyleButton>
                                    </AccountButtonContainer>
                                )}
                                {account.is_unlinkable && (
                                    <AccountButtonContainer>
                                        <NoStyleButton onClick={() => onUnlink(account.id)}>
                                            <AccountNameSpan>Remove link</AccountNameSpan>
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
