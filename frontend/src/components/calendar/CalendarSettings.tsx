import styled from 'styled-components'
import { useSetting } from '../../hooks'
import { useGetCalendars } from '../../services/api/events.hooks'
import { Border, Colors, Spacing } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TCalendar, TCalendarAccount } from '../../utils/types'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import { Body, BodySmall, Label } from '../atoms/typography/Typography'
import getCalendarColor from './utils/colors'

const Calendar = styled(Flex)`
    cursor: pointer;
    border: ${Border.stroke.small} solid transparent;
    border-radius: ${Border.radius.mini};
    padding: ${Spacing._8} ${Spacing._4};
    box-sizing: border-box;
    :hover {
        border: ${Border.stroke.small} solid ${Colors.border.light};
        background-color: ${Colors.background.light};
    }
`

const CalendarSettings = () => {
    const { data: calendars } = useGetCalendars()
    const { field_value: taskToCalAccount, updateSetting: setTaskToCalAccount } = useSetting(
        'calendar_account_id_for_new_tasks'
    )
    const { field_value: taskToCalCalendar, updateSetting: setTaskToCalCalendar } =
        useSetting('calendar_id_for_new_tasks')
    const handleClick = (account: TCalendarAccount, calendar: TCalendar) => {
        setTaskToCalAccount(account.account_id)
        setTaskToCalCalendar(calendar.calendar_id)
    }

    return (
        <Flex gap={Spacing._24} column>
            <Flex column gap={Spacing._4}>
                <Body>Choose default calendar</Body>
                <Label>Choose the default calendar for new events to appear.</Label>
            </Flex>

            {calendars?.map((account) => (
                <Flex column gap={Spacing._8} key={account.account_id}>
                    <Flex alignItems="center" gap={Spacing._8}>
                        <Icon icon={logos.gcal} />
                        <BodySmall>{account.account_id}</BodySmall>
                    </Flex>
                    <div>
                        {account.calendars
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
                                    onClick={() => handleClick(account, calendar)}
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
                                    <Icon icon={icons.square} colorHex={getCalendarColor(calendar.color_id)} />
                                    <BodySmall>{calendar.title}</BodySmall>
                                </Calendar>
                            ))}
                    </div>
                </Flex>
            ))}
        </Flex>
    )
}

export default CalendarSettings
