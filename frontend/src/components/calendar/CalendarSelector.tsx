import { ReactNode, useMemo } from 'react'
import { useGetCalendars, useSelectedCalendars } from '../../services/api/events.hooks'
import { logos } from '../../styles/images'
import { EMPTY_ARRAY } from '../../utils/utils'
import GTDropdownMenu from '../radix/GTDropdownMenu'

interface CalendarSelectorProps {
    mode: 'task-to-cal' | 'cal-selection'
    trigger: ReactNode
}
const CalendarSelector = ({ mode, trigger }: CalendarSelectorProps) => {
    const { data: calendars } = useGetCalendars()
    const { lookupTable } = useSelectedCalendars()

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
                ...account.calendars.map((calendar) => ({
                    label: calendar.calendar_id,
                    selected:
                        mode === 'cal-selection' && lookupTable.get(account.account_id)?.has(calendar.calendar_id),
                })),
            ]) ?? EMPTY_ARRAY,
        [calendars, lookupTable, mode]
    )

    return <GTDropdownMenu items={items} trigger={trigger} />
}

export default CalendarSelector
