import styled from 'styled-components'
import { GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../../constants'
import { useAuthWindow, usePreviewMode, useSetting } from '../../hooks'
import { useGetCalendars } from '../../services/api/events.hooks'
import { useDeleteLinkedAccount, useGetLinkedAccounts, useGetSupportedTypes } from '../../services/api/settings.hooks'
import { Border, Colors, Spacing } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TCalendar, TCalendarAccount } from '../../utils/types'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Body, BodySmall, Label } from '../atoms/typography/Typography'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { getCalendarAuthButton, getCalendarName } from './utils/utils'

const Calendar = styled(Flex)`
    cursor: pointer;
    border: ${Border.stroke.small} solid transparent;
    border-radius: ${Border.radius.small};
    padding: ${Spacing._8} ${Spacing._4};
    box-sizing: border-box;
    :hover {
        border: ${Border.stroke.small} solid ${Colors.background.border};
        background-color: ${Colors.background.base};
    }
`

const CalendarSettings = () => {
    const { isPreviewMode } = usePreviewMode()
    const { updateSetting: setHasDismissedMulticalPrompt } = useSetting('has_dismissed_multical_prompt')
    const { data: calendars } = useGetCalendars()
    const { field_value: taskToCalAccount, updateSetting: setTaskToCalAccount } = useSetting(
        'calendar_account_id_for_new_tasks'
    )
    const { field_value: taskToCalCalendar, updateSetting: setTaskToCalCalendar } = useSetting(
        'calendar_calendar_id_for_new_tasks'
    )
    const { openAuthWindow } = useAuthWindow()
    const { data: linkedAccounts } = useGetLinkedAccounts()
    const { mutate: deleteAccount } = useDeleteLinkedAccount()
    const { data: supportedTypes } = useGetSupportedTypes()

    const handleTaskToCalSelect = (account: TCalendarAccount, calendar: TCalendar) => {
        setTaskToCalAccount(account.account_id)
        setTaskToCalCalendar(calendar.calendar_id)
    }
    const handleReauthorization = () => {
        const authUrl = supportedTypes?.find(
            (supportedType) => supportedType.name === GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME
        )?.authorization_url
        if (authUrl) {
            openAuthWindow({ url: authUrl, isGoogleSignIn: true })
        }
    }
    const handleDeleteAccount = (accountId: string) => {
        const linkedAccountId = linkedAccounts
            ?.filter((linkedAccount) => linkedAccount.name === GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME)
            .find((linkedAccount) => linkedAccount.display_id === accountId)?.id
        if (linkedAccountId) {
            deleteAccount({ id: linkedAccountId })
        }
    }

    return (
        <Flex gap={Spacing._24} column>
            <Flex column gap={Spacing._4}>
                <Body>Choose default calendar</Body>
                <Label>Choose the default calendar to create new events in</Label>
            </Flex>

            {calendars?.map((account) => (
                <Flex column gap={Spacing._8} key={account.account_id}>
                    <Flex alignItems="center" justifyContent="space-between">
                        <Flex alignItems="center" gap={Spacing._8}>
                            <Icon icon={logos.gcal} />
                            <BodySmall>{account.account_id}</BodySmall>
                        </Flex>
                        <Flex gap={Spacing._8}>
                            {getCalendarAuthButton(account, handleReauthorization)}
                            <GTDropdownMenu
                                hideCheckmark
                                items={[
                                    {
                                        label: 'Disconnect account',
                                        onClick: () => handleDeleteAccount(account.account_id),
                                    },
                                ]}
                                trigger={
                                    <GTIconButton icon={icons.ellipsisVertical} tooltipText="More options" asDiv />
                                }
                            />
                        </Flex>
                    </Flex>
                    <div>
                        {account.calendars
                            .filter((calendar) => calendar.can_write)
                            .sort((a, b) => {
                                // place the primary calendar at the top
                                if (a.calendar_id === 'primary' || a.calendar_id === account.account_id) return -1
                                if (b.calendar_id === 'primary' || b.calendar_id === account.account_id) return 1
                                return 0
                            })
                            .map((calendar) => (
                                <Calendar
                                    key={calendar.calendar_id}
                                    gap={Spacing._8}
                                    alignItems="center"
                                    onClick={() => handleTaskToCalSelect(account, calendar)}
                                >
                                    <Icon
                                        icon={icons.check}
                                        hidden={
                                            !(
                                                account.account_id === taskToCalAccount &&
                                                calendar.calendar_id === taskToCalCalendar
                                            )
                                        }
                                    />
                                    <Icon icon={icons.square} colorHex={calendar.color_background} />
                                    <BodySmall>{getCalendarName(account.account_id, calendar.title)}</BodySmall>
                                </Calendar>
                            ))}
                    </div>
                </Flex>
            ))}
            {isPreviewMode && (
                <Flex justifyContent="space-between" alignItems="center">
                    <BodySmall>
                        Secret button to un-dismiss calendar auth banner (if you have calendars that need multi-cal
                        enabled)
                    </BodySmall>
                    <GTButton
                        value="Un-dismiss"
                        styleType="secondary"
                        onClick={() => setHasDismissedMulticalPrompt('false')}
                    />
                </Flex>
            )}
        </Flex>
    )
}

export default CalendarSettings
