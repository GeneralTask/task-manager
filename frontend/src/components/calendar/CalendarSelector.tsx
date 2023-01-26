import { ReactNode, useMemo } from 'react'
import { useGetCalendars, useSelectedCalendars } from '../../services/api/events.hooks'
import { icons, logos } from '../../styles/images'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { DEFAULT_CALENDAR_COLOR, calendarColors } from './utils/colors'

interface CalendarSelectorProps {
    mode: 'task-to-cal' | 'cal-selection'
    trigger: ReactNode
}
const CalendarSelector = ({ mode, trigger }: CalendarSelectorProps) => {
    const { data: calendars } = useGetCalendars()
    const { isCalendarSelected } = useSelectedCalendars()
    const items = useMemo(
        () =>
            calendars?.map((account) => [
                // label to show account name
                {
                    label: account.account_id,
                    hideCheckmark: true,
                    disabled: true,
                    icon: logos.gcal,
                },
                ...account.calendars
                    .sort((a, b) => {
                        // place the primary calendar at the top
                        if (a.calendar_id === 'primary' || a.calendar_id === account.account_id) return -1
                        if (b.calendar_id === 'primary' || b.calendar_id === account.account_id) return 1
                        return 0
                    })
                    .map((calendar) => ({
                        label: calendar.title || account.account_id, // backend sends empty string for title if it is the primary calendar
                        icon: icons.square,
                        iconColorHex:
                            calendarColors[calendar.color_id as keyof typeof calendarColors]?.background ??
                            DEFAULT_CALENDAR_COLOR,
                        selected:
                            mode === 'cal-selection' && isCalendarSelected(account.account_id, calendar.calendar_id),
                    })),
            ]) ?? [],
        [calendars, isCalendarSelected, mode]
    )

    return <GTDropdownMenu items={items} trigger={trigger} fontStyle="bodySmall" />
}

export default CalendarSelector
