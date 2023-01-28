import { useSetting } from '../../hooks'
import { useGetCalendars, useSelectedCalendars } from '../../services/api/events.hooks'
import { Spacing } from '../../styles'
import { icons, logos } from '../../styles/images'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import { Body, BodySmall, Label } from '../atoms/typography/Typography'
import getCalendarColor from './utils/colors'

const CalendarSettings = () => {
    const { data: calendars } = useGetCalendars()
    const { isCalendarSelected, toggleCalendarSelection } = useSelectedCalendars()
    const { field_value: taskToCalAccount, updateSetting: setTaskToCalAccount } = useSetting(
        'calendar_account_id_for_new_tasks'
    )
    const { field_value: taskToCalCalendar, updateSetting: setTaskToCalCalendar } =
        useSetting('calendar_id_for_new_tasks')

    return (
        <Flex gap={Spacing._24} column>
            <Flex column gap={Spacing._4}>
                <Body>Choose default calendar</Body>
                <Label>Choose the default calendar for new events to appear.</Label>
            </Flex>

            {calendars?.map((account) => (
                <Flex column gap={Spacing._16} key={account.account_id}>
                    <Flex alignItems="center" gap={Spacing._8}>
                        <Icon icon={logos.gcal} />
                        <BodySmall>{account.account_id}</BodySmall>
                    </Flex>
                    {account.calendars
                        .sort((a, b) => {
                            // place the primary calendar at the top
                            if (a.calendar_id === 'primary' || a.calendar_id === account.account_id) return -1
                            if (b.calendar_id === 'primary' || b.calendar_id === account.account_id) return 1
                            return 0
                        })
                        .map((calendar) => (
                            <Flex key={calendar.calendar_id} gap={Spacing._8} alignItems="center">
                                <Icon icon={icons.check} hidden />
                                <Icon icon={icons.square} colorHex={getCalendarColor(calendar.color_id)} />
                                <BodySmall>{calendar.title}</BodySmall>
                            </Flex>
                        ))}
                </Flex>
            ))}
        </Flex>
    )
}

export default CalendarSettings
