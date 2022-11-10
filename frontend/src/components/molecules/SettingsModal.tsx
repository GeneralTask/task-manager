import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../../constants'
import useRefetchStaleQueries from '../../hooks/useRefetchStaleQueries'
import Log from '../../services/api/log'
import { useDeleteLinkedAccount, useGetLinkedAccounts, useGetSupportedTypes } from '../../services/api/settings.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { openPopupWindow } from '../../utils/auth'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Body, BodySmall, Label } from '../atoms/typography/Typography'
import GTModal from '../mantine/GTModal'
import SignOutButton from '../molecules/SignOutButton'

const SERVICE_WIDTH = '160px'

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
const ServiceDetails = styled.div`
    ${Typography.label};
    color: ${Colors.text.light};
    margin-bottom: auto;
`

interface SettingsModalProps {
    isCollapsed?: boolean
}
const SettingsModal = ({ isCollapsed = false }: SettingsModalProps) => {
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const { data: userInfo } = useGetUserInfo()
    const { data: supportedTypes } = useGetSupportedTypes()
    const { data: linkedAccounts } = useGetLinkedAccounts()
    const { mutate: deleteAccount } = useDeleteLinkedAccount()
    const refetchStaleQueries = useRefetchStaleQueries()

    useEffect(() => {
        refetchStaleQueries()
    }, [linkedAccounts])

    const onUnlink = (id: string) => {
        Log(`unlink_account_${id}`)
        deleteAccount({ id: id })
    }
    const onRelink = (accountType: string) => {
        Log(`relink_acocount_${accountType}`)
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
        'Google Calendar': 'See your upcoming events and schedule tasks by dragging them onto your calendar.',
        Linear: 'See, update, and schedule the issues assigned to you.',
        GitHub: 'See pull requests from the repos that matter to you.',
    }

    return (
        <>
            {isCollapsed ? (
                <GTIconButton icon={icons.gear} onClick={() => setModalIsOpen(true)} />
            ) : (
                <GTButton
                    value="Settings"
                    styleType="secondary"
                    size="small"
                    fitContent={false}
                    onClick={() => setModalIsOpen(true)}
                />
            )}
            <GTModal
                open={modalIsOpen}
                setIsModalOpen={setModalIsOpen}
                title="Settings"
                size="lg"
                tabs={[
                    {
                        title: 'Services',
                        icon: icons.globe,
                        body: (
                            <>
                                <Body>Add a new service</Body>
                                <ServicesContainer>
                                    {supportedTypes
                                        ?.sort((a, b) => b.name.localeCompare(a.name))
                                        .map((supportedType) => (
                                            <Service key={supportedType.name}>
                                                <Icon icon={logos[supportedType.logo_v2]} />
                                                <BodySmall>{supportedType.name}</BodySmall>
                                                <ServiceDetails>
                                                    {serviceDetails[supportedType.name as keyof typeof serviceDetails]}
                                                </ServiceDetails>
                                                <div>
                                                    <GTButton
                                                        icon={icons.external_link}
                                                        value={`Connect ${
                                                            supportedType.name === GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME
                                                                ? 'Google'
                                                                : supportedType.name
                                                        }`}
                                                        onClick={() =>
                                                            openPopupWindow(
                                                                supportedType.authorization_url,
                                                                refetchStaleQueries
                                                            )
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
                                            Add General Task to your Slack workspace. This is only required once per
                                            workspace.
                                        </ServiceDetails>
                                        <a
                                            href="https://slack.com/oauth/v2/authorize?client_id=1734323190625.3674283101555&scope=commands,chat:write&user_scope=users:read"
                                            onClick={() => Log(`add_to_slack`)}
                                        >
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
                                <Body>My services</Body>
                                {linkedAccounts && linkedAccounts.length > 0 ? (
                                    linkedAccounts?.map((account) => (
                                        <Flex justifyContent="space-between" alignItems="center" key={account.id}>
                                            <Flex alignItems="center" gap={Spacing._16}>
                                                <Icon icon={logos[account.logo_v2]} />
                                                <Flex column>
                                                    <Label>{account.name}</Label>
                                                    <Label color="light">{account.display_id}</Label>
                                                </Flex>
                                            </Flex>
                                            <Flex gap={Spacing._8}>
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
                                            </Flex>
                                        </Flex>
                                    ))
                                ) : (
                                    <ServiceDetails>
                                        You have no connected services. Click from the options above to get started.
                                    </ServiceDetails>
                                )}
                            </>
                        ),
                    },
                    {
                        title: 'Account details',
                        icon: icons.user,
                        body: (
                            <>
                                <Service>
                                    <Label color="light">Email</Label>
                                    <Label>{userInfo?.email}</Label>
                                </Service>
                                <div>
                                    <SignOutButton />
                                </div>
                            </>
                        ),
                    },
                ]}
            />
        </>
    )
}

export default SettingsModal
