import { ReactNode, useCallback, useMemo } from 'react'
import { useSetting } from '../../hooks'
import { useGetCalendars, useSelectedCalendars } from '../../services/api/events.hooks'
import { icons, logos } from '../../styles/images'
import { TCalendar, TCalendarAccount } from '../../utils/types'
import { EMPTY_ARRAY } from '../../utils/utils'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { getCalendarName } from './utils/utils'

interface CalendarSelectorProps {
    mode: 'task-to-cal' | 'cal-selection'
    useTriggerWidth?: boolean
    renderTrigger: (calendar: TCalendar | undefined, accountId: string) => ReactNode
}
const CalendarSelector = ({ mode, useTriggerWidth, renderTrigger }: CalendarSelectorProps) => {
    const { data: calendars } = useGetCalendars()
    const { isCalendarSelected, toggleCalendarSelection } = useSelectedCalendars()
    const { field_value: taskToCalAccount, updateSetting: setTaskToCalAccount } = useSetting(
        'calendar_account_id_for_new_tasks'
    )
    const { field_value: taskToCalCalendar, updateSetting: setTaskToCalCalendar } = useSetting(
        'calendar_calendar_id_for_new_tasks'
    )

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
                toggleCalendarSelection(account.account_id, calendar)
            }
        },
        [mode, setTaskToCalAccount, setTaskToCalCalendar, isCalendarSelected, toggleCalendarSelection]
    )

    const selectedTaskToCalCalendar = useMemo(() => {
        return calendars
            ?.find((account) => account.account_id === taskToCalAccount)
            ?.calendars.find((calendar) => calendar.calendar_id === taskToCalCalendar)
    }, [calendars, taskToCalAccount, taskToCalCalendar])

    const items = useMemo(
        () =>
            calendars
                ?.filter((account) => account.has_multical_scopes || account.has_primary_calendar_scopes)
                .map((account) => [
                    // label to show account name
                    {
                        label: account.account_id,
                        hideCheckmark: true,
                        disabled: true,
                        icon: logos.gcal,
                    },
                    ...account.calendars
                        .filter((calendar) => mode === 'cal-selection' || calendar.can_write)
                        .sort((a, b) => {
                            // place the primary calendar at the top
                            if (a.calendar_id === 'primary' || a.calendar_id === account.account_id) return -1
                            if (b.calendar_id === 'primary' || b.calendar_id === account.account_id) return 1
                            return 0
                        })
                        .map((calendar) => ({
                            label: getCalendarName(account.account_id, calendar.title),
                            icon: icons.square,
                            iconColorHex: calendar.color_background,
                            selected: isCalendarChecked(account, calendar),
                            onClick: () => handleCalendarClick(account, calendar),
                            keepOpenOnSelect: mode === 'cal-selection',
                            // disable task-to-cal calendar from being deselected in cal-selection mode
                            disabled:
                                mode === 'cal-selection' &&
                                taskToCalAccount === account.account_id &&
                                taskToCalCalendar === calendar.calendar_id,
                        })),
                ]) ?? EMPTY_ARRAY,
        [calendars, isCalendarChecked, handleCalendarClick, mode]
    )

    return (
        <GTDropdownMenu
            items={items}
            trigger={renderTrigger(selectedTaskToCalCalendar, taskToCalAccount)}
            align={mode === 'cal-selection' ? 'start' : 'center'}
            fontStyle="medium"
            description={
                mode === 'cal-selection'
                    ? 'Choose which calendars to show or hide'
                    : 'Choose the default calendar to create new events in'
            }
            useTriggerWidth={useTriggerWidth}
        />
    )
}

export default CalendarSelector
