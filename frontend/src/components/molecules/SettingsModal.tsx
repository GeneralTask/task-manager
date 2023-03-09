import { useEffect } from 'react'
import styled from 'styled-components'
import { useTernaryDarkMode } from 'usehooks-ts'
import { GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../../constants'
import { useGTLocalStorage, usePreviewMode, useSetting } from '../../hooks'
import { useAuthWindow } from '../../hooks'
import useRefetchStaleQueries from '../../hooks/useRefetchStaleQueries'
import { useGetCalendars } from '../../services/api/events.hooks'
import Log from '../../services/api/log'
import { useDeleteLinkedAccount, useGetLinkedAccounts, useGetSupportedTypes } from '../../services/api/settings.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TLinkedAccount } from '../../utils/types'
import Flex from '../atoms/Flex'
import GTCheckbox from '../atoms/GTCheckbox'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { DeprecatedBody, DeprecatedBodySmall, DeprecatedLabel } from '../atoms/typography/Typography'
import CalendarSettings from '../calendar/CalendarSettings'
import { getCalendarAuthButton } from '../calendar/utils/utils'
import GTModal from '../mantine/GTModal'
import SignOutButton from './SignOutButton'

const SERVICE_WIDTH = '150px'

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
    ${Typography.deprecated_label};
    color: ${Colors.text.light};
    margin-bottom: auto;
`
const TruncatedLabel = styled(DeprecatedLabel)`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`

interface SettingsModalProps {
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
    defaultTabIndex?: number
}
const SettingsModal = ({ isOpen, setIsOpen, defaultTabIndex }: SettingsModalProps) => {
    const { isPreviewMode } = usePreviewMode()
    const { data: userInfo } = useGetUserInfo()
    const { data: supportedTypes } = useGetSupportedTypes()
    const { mutate: deleteAccount } = useDeleteLinkedAccount()
    const { data: linkedAccounts } = useGetLinkedAccounts()
    const { openAuthWindow } = useAuthWindow()
    const { data: calendars } = useGetCalendars()

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
                openAuthWindow({ url: type.authorization_url })
                return
            }
        }
    }

    const serviceDetails = {
        Slack: 'Turn any Slack message into an actionable task.',
        'Google Calendar': 'See your upcoming events and schedule tasks by dragging them onto your calendar.',
        Linear: 'See, update, and schedule the issues assigned to you.',
        GitHub: 'See pull requests from the repos that matter to you.',
        Jira: 'See, update, and schedule the issues assigned to you.',
    }

    const { isDarkMode, toggleTernaryDarkMode } = useTernaryDarkMode()
    const [resizableDetails, setResizableDetails] = useGTLocalStorage('resizableDetails', false)

    const showGitHubSetting = useSetting('sidebar_github_preference')
    const showLinearSetting = useSetting('sidebar_linear_preference')
    const showSlackSetting = useSetting('sidebar_slack_preference')
    const showJiraSetting = useSetting('sidebar_jira_preference')

    const nameToSetting = {
        GitHub: {
            setting: showGitHubSetting,
            show: showGitHubSetting.field_value === 'true',
        },
        Linear: {
            setting: showLinearSetting,
            show: showLinearSetting.field_value === 'true',
        },
        Slack: {
            setting: showSlackSetting,
            show: showSlackSetting.field_value === 'true',
        },
        Jira: {
            setting: showJiraSetting,
            show: showJiraSetting.field_value === 'true',
        },
    }
    type TNameToSetting = keyof typeof nameToSetting

    const VisibilityButton = ({ accountName }: { accountName: TNameToSetting }) => (
        <GTIconButton
            icon={nameToSetting[accountName].show ? icons.eye : icons.eye_slash}
            onClick={() => nameToSetting[accountName].setting.updateSetting(!nameToSetting[accountName].show)}
            tooltipText={`${nameToSetting[accountName].show ? 'Hide' : 'Show'} ${accountName} in sidebar`}
        />
    )

    const getEnableAllCalendarsButton = (account: TLinkedAccount) => {
        if (account.name !== GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME || !calendars) return
        const calendar = calendars.find((calendar) => calendar.account_id === account.display_id)
        if (!calendar || calendar?.has_multical_scopes) return
        const authUrl = supportedTypes?.find(
            (supportedType) => supportedType.name === GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME
        )?.authorization_url
        if (!authUrl) return

        return getCalendarAuthButton(calendar, () => openAuthWindow({ url: authUrl, isGoogleSignIn: true }))
    }

    return (
        <GTModal
            open={isOpen}
            setIsModalOpen={setIsOpen}
            title="Settings"
            size="lg"
            defaultTabIndex={defaultTabIndex}
            tabs={[
                {
                    title: 'Integrations',
                    icon: icons.globe,
                    body: (
                        <Flex column gap={Spacing._24}>
                            <DeprecatedBody>Add a new service</DeprecatedBody>
                            <ServicesContainer>
                                {supportedTypes
                                    ?.sort((a, b) => a.name.localeCompare(b.name))
                                    .map((supportedType) => (
                                        <Service key={supportedType.name}>
                                            <Icon icon={logos[supportedType.logo_v2]} />
                                            <DeprecatedBodySmall>{supportedType.name}</DeprecatedBodySmall>
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
                                                        openAuthWindow({
                                                            url: supportedType.authorization_url,
                                                            isGoogleSignIn:
                                                                supportedType.name ===
                                                                GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME,
                                                        })
                                                    }
                                                    styleType="secondary"
                                                    size="small"
                                                />
                                            </div>
                                        </Service>
                                    ))}
                                <Service>
                                    <Icon icon={logos.slack} />
                                    <DeprecatedBodySmall>Slack (workspace)</DeprecatedBodySmall>
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
                            <Divider color={Colors.background.border} />
                            <DeprecatedBody>My integrations</DeprecatedBody>
                            {linkedAccounts && linkedAccounts.length > 0 ? (
                                linkedAccounts?.map((account) => (
                                    <Flex justifyContent="space-between" alignItems="center" key={account.id}>
                                        <Flex alignItems="center" gap={Spacing._16}>
                                            <Icon icon={logos[account.logo_v2]} />
                                            <Flex column>
                                                <DeprecatedLabel>{account.name}</DeprecatedLabel>
                                                <DeprecatedLabel color="light">{account.display_id}</DeprecatedLabel>
                                            </Flex>
                                        </Flex>
                                        <Flex gap={Spacing._8}>
                                            {account.name in nameToSetting && (
                                                <VisibilityButton accountName={account.name as TNameToSetting} />
                                            )}
                                            {account.has_bad_token ? (
                                                <GTButton
                                                    onClick={() => onRelink(account.name)}
                                                    value="Re-link account"
                                                    styleType="secondary"
                                                    size="small"
                                                    textColor="red"
                                                />
                                            ) : (
                                                getEnableAllCalendarsButton(account)
                                            )}
                                            {account.is_unlinkable && (
                                                <GTButton
                                                    onClick={() => onUnlink(account.id)}
                                                    value="Disconnect account"
                                                    styleType="secondary"
                                                    size="small"
                                                />
                                            )}
                                        </Flex>
                                    </Flex>
                                ))
                            ) : (
                                <ServiceDetails>
                                    You have no connected integrations. Click from the options above to get started.
                                </ServiceDetails>
                            )}
                        </Flex>
                    ),
                },
                {
                    title: 'Calendar',
                    icon: icons.calendar_blank,
                    body: <CalendarSettings />,
                },
                {
                    title: 'Account details',
                    icon: icons.user,
                    body: (
                        <Flex column gap={Spacing._24}>
                            <Flex column gap={Spacing._12}>
                                <DeprecatedLabel color="light">Email</DeprecatedLabel>
                                <TruncatedLabel>{userInfo?.email}</TruncatedLabel>
                            </Flex>
                            <div>
                                <SignOutButton />
                            </div>
                        </Flex>
                    ),
                },
                ...(isPreviewMode
                    ? [
                          {
                              title: 'Lab',
                              subtitle:
                                  'Preview early versions of new features while they’re still in beta. Feel free to leave us feedback!',
                              icon: icons.flask,
                              body: (
                                  <Flex column gap={Spacing._24}>
                                      <Flex gap={Spacing._16} alignItems="center">
                                          <GTCheckbox
                                              isChecked={isDarkMode}
                                              onChange={toggleTernaryDarkMode}
                                              disabled
                                          />
                                          <Flex column gap={Spacing._4}>
                                              <DeprecatedBody>Dark mode</DeprecatedBody>
                                              <DeprecatedLabel color="light">Activate dark mode</DeprecatedLabel>
                                          </Flex>
                                      </Flex>
                                      <Flex gap={Spacing._16} alignItems="center">
                                          <GTCheckbox
                                              isChecked={resizableDetails}
                                              onChange={setResizableDetails}
                                              disabled
                                          />
                                          <Flex column gap={Spacing._4}>
                                              <DeprecatedBody>Resizable task details</DeprecatedBody>
                                              <DeprecatedLabel color="light">
                                                  Some supporting secondary copy to describe this feature
                                              </DeprecatedLabel>
                                          </Flex>
                                      </Flex>
                                  </Flex>
                              ),
                          },
                      ]
                    : []),
            ]}
        />
    )
}

export default SettingsModal
