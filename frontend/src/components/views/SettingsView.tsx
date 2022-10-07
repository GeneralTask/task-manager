import styled from 'styled-components'
import useRefetchStaleQueries from '../../hooks/useRefetchStaleQueries'
import { useDeleteLinkedAccount, useGetLinkedAccounts, useGetSupportedTypes } from '../../services/api/settings.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { DEFAULT_VIEW_WIDTH } from '../../styles/dimensions'
import { icons, logos } from '../../styles/images'
import { openPopupWindow } from '../../utils/auth'
import { Icon } from '../atoms/Icon'
import Loading from '../atoms/Loading'
import { Divider } from '../atoms/SectionDivider'
import GTButton from '../atoms/buttons/GTButton'
import { SectionHeader } from '../molecules/Header'
import SignOutButton from '../molecules/SignOutButton'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const SERVICE_WIDTH = '160px'

const SettingsViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-width: ${DEFAULT_VIEW_WIDTH};
    gap: ${Spacing._24};
    padding: ${Spacing._24};
`
const Account = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`
const AccountInfo = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing._16};
`
const AccountButtons = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._8};
`
const AccountNameContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
`
const AccountName = styled.span`
    ${Typography.label};
    color: ${Colors.text.black};
`
const AccountID = styled.span`
    ${Typography.label};
    color: ${Colors.text.light};
`
const SectionDescriptor = styled.span`
    ${Typography.body};
    color: ${Colors.text.black};
`
const ServicesContainer = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: ${Spacing._32};
`
const Service = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._12};
    width: ${SERVICE_WIDTH};
`
const ServiceName = styled.div`
    ${Typography.bodySmall};
    color: ${Colors.text.black};
`
const ServiceDetails = styled.div`
    ${Typography.label};
    color: ${Colors.text.light};
    margin-bottom: auto;
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

    const serviceDetails = {
        Slack: 'Turn any Slack message into an actionable task.',
        Google: 'See your upcoming events and schedule tasks by dragging them onto your calendar.',
        Linear: 'See, update, and schedule the issues assigned to you.',
        Github: 'See pull requests from the repos that matter to you.',
    }

    if (!supportedTypes || !linkedAccounts) return <Loading />

    return (
        <ScrollableListTemplate>
            <SectionHeader sectionName="Settings" />
            <SettingsViewContainer>
                <SectionDescriptor>Add a new service</SectionDescriptor>
                <ServicesContainer>
                    {supportedTypes
                        .sort((a, b) => b.name.localeCompare(a.name))
                        .map((supportedType) => (
                            <Service key={supportedType.name}>
                                <Icon icon={supportedType.logo} />
                                <ServiceName>{supportedType.name}</ServiceName>
                                <ServiceDetails>
                                    {serviceDetails[supportedType.name as keyof typeof serviceDetails]}
                                </ServiceDetails>
                                <div>
                                    <GTButton
                                        icon={icons.external_link}
                                        value={`Connect ${supportedType.name}`}
                                        onClick={() =>
                                            openPopupWindow(supportedType.authorization_url, refetchStaleQueries)
                                        }
                                        styleType="secondary"
                                        size="small"
                                    />
                                </div>
                            </Service>
                        ))}
                </ServicesContainer>
                <ServicesContainer>
                    <Service>
                        <ServiceDetails>
                            Add General Task to your Slack workspace. This is only required once per workspace.
                        </ServiceDetails>
                        <a href="https://slack.com/oauth/v2/authorize?client_id=1734323190625.3674283101555&scope=commands,chat:write&user_scope=users:read">
                            <img
                                alt="Add to Slack"
                                height="40"
                                width="139"
                                src="https://platform.slack-edge.com/img/add_to_slack.png"
                                srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                            />
                        </a>
                    </Service>
                </ServicesContainer>
                <Divider color={Colors.border.light} />
                <SectionDescriptor>My services</SectionDescriptor>
                {linkedAccounts.length > 0 ? (
                    linkedAccounts?.map((account) => (
                        <Account key={account.id}>
                            <AccountInfo>
                                <Icon icon={logos[account.logo_v2]} />
                                <AccountNameContainer>
                                    <AccountName>{account.name}</AccountName>
                                    <AccountID>{account.display_id}</AccountID>
                                </AccountNameContainer>
                            </AccountInfo>
                            <AccountButtons>
                                {account.has_bad_token && (
                                    <GTButton
                                        onClick={() => onRelink(account.name)}
                                        value="Re-link account"
                                        styleType="secondary"
                                        size="small"
                                        textColor="red"
                                    />
                                )}
                                {account.is_unlinkable && (
                                    <GTButton
                                        onClick={() => onUnlink(account.id)}
                                        value="Remove account"
                                        styleType="secondary"
                                        size="small"
                                    />
                                )}
                            </AccountButtons>
                        </Account>
                    ))
                ) : (
                    <ServiceDetails>
                        You have no connected services. Click from the options above to get started.
                    </ServiceDetails>
                )}
                <Divider color={Colors.border.light} />
                <SignOutButton />
            </SettingsViewContainer>
        </ScrollableListTemplate>
    )
}

export default SettingsView
