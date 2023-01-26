import { ReactNode, useCallback, useMemo, useState } from 'react'
import { useSetting } from '../../hooks'
import { useGetCalendars, useSelectedCalendars } from '../../services/api/events.hooks'
import { logos } from '../../styles/images'
import { TCalendar, TCalendarAccount } from '../../utils/types'
import { EMPTY_ARRAY } from '../../utils/utils'
import GTDropdownMenu from '../radix/GTDropdownMenu'

interface CalendarSelectorProps {
    mode: 'task-to-cal' | 'cal-selection'
    trigger: ReactNode
}
const CalendarSelector = ({ mode, trigger }: CalendarSelectorProps) => {
    const { data: calendars } = useGetCalendars()
    const { isCalendarSelected, toggleCalendar } = useSelectedCalendars()

    const { field_value: taskToCalAccount, updateSetting: setTaskToCalAccount } = useSetting(
        'calendar_account_id_for_new_tasks'
    )
    const [taskToCalCalendar, setTaskToCalCalendar] = useState(taskToCalAccount)

    const isCalendarChecked = useCallback(
        (account: TCalendarAccount, calendar: TCalendar) => {
            if (mode === 'task-to-cal') {
                return taskToCalAccount === account.account_id && taskToCalCalendar === calendar.calendar_id
            }
            return isCalendarSelected(account.account_id, calendar.calendar_id)
        },
        [mode, taskToCalAccount, taskToCalCalendar, isCalendarSelected]
    )

    const handleCalendarClick = useCallback(
        (account: TCalendarAccount, calendar: TCalendar) => {
            if (mode === 'task-to-cal') {
                setTaskToCalAccount(account.account_id)
                setTaskToCalCalendar(calendar.calendar_id)
            } else {
                toggleCalendar(account.account_id, calendar)
            }
        },
        [mode, setTaskToCalAccount, setTaskToCalCalendar, toggleCalendar]
    )

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
                        selected: isCalendarChecked(account, calendar),
                        onClick: () => handleCalendarClick(account, calendar),
                        keepOpenOnSelect: true,
                    })),
            ]) ?? EMPTY_ARRAY,
        [calendars, isCalendarChecked, handleCalendarClick]
    )

    return <GTDropdownMenu items={items} trigger={trigger} align={mode === 'cal-selection' ? 'start' : 'center'} />
}

export default CalendarSelector
