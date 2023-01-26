import { useCallback, useMemo } from 'react'
import { useSetting } from '../../hooks'
import { useGetCalendars, useSelectedCalendars } from '../../services/api/events.hooks'
import { icons, logos } from '../../styles/images'
import { TCalendar, TCalendarAccount } from '../../utils/types'
import { EMPTY_ARRAY } from '../../utils/utils'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { DEFAULT_CALENDAR_COLOR, calendarColors } from './utils/colors'

interface CalendarSelectorProps {
    mode: 'task-to-cal' | 'cal-selection'
}
const CalendarSelector = ({ mode }: CalendarSelectorProps) => {
    const { data: calendars } = useGetCalendars()
    const { isCalendarSelected, toggleCalendarSelection } = useSelectedCalendars()
    const { field_value: taskToCalAccount, updateSetting: setTaskToCalAccount } = useSetting(
        'calendar_account_id_for_new_tasks'
    )
    const { field_value: taskToCalCalendar, updateSetting: setTaskToCalCalendar } =
        useSetting('calendar_id_for_new_tasks')

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
        [mode, setTaskToCalAccount, setTaskToCalCalendar, toggleCalendarSelection]
    )

    const selectedTaskToCalCalendar = useMemo(() => {
        return calendars
            ?.find((account) => account.account_id === taskToCalAccount)
            ?.calendars.find((calendar) => calendar.calendar_id === taskToCalCalendar)
    }, [calendars, taskToCalAccount, taskToCalCalendar])

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
                        selected: isCalendarChecked(account, calendar),
                        onClick: () => handleCalendarClick(account, calendar),
                        keepOpenOnSelect: true,
                    })),
            ]) ?? EMPTY_ARRAY,
        [calendars, isCalendarChecked, handleCalendarClick]
    )

    return (
        <GTDropdownMenu
            items={items}
            trigger={
                mode === 'cal-selection' ? (
                    <GTIconButton icon={icons.eye} tooltipText="Show/hide calendars" asDiv />
                ) : (
                    <GTButton
                        value={selectedTaskToCalCalendar?.title || 'Select a calendar'}
                        icon={icons.square}
                        iconColorHex={
                            calendarColors[selectedTaskToCalCalendar?.color_id as keyof typeof calendarColors]
                                ?.background ?? DEFAULT_CALENDAR_COLOR
                        }
                        asDiv
                        isDropdown
                        styleType="secondary"
                        size="small"
                        fitContent={false}
                    />
                )
            }
            align={mode === 'cal-selection' ? 'start' : 'center'}
            unstyledTrigger
            fontStyle="bodySmall"
            description={
                mode === 'cal-selection'
                    ? 'Choose which calendars to show or hide'
                    : 'Choose the default calendar for new events to appear in'
            }
        />
    )
}

export default CalendarSelector
