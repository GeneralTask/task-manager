import { useEffect } from 'react'
import { useGTLocalStorage } from '../../../hooks'
import { useGetCalendars } from '../../../services/api/events.hooks'
import { TCalendarAccount } from '../../../utils/types'

/* 
    'selectedCalendars' in localstorage contains an array of all calendar accounts. Each calendar account contains an array of calendars that are selected.
*/

const useSelectedCalendars = () => {
    const { data: calendars } = useGetCalendars()
    const [selectedCalendars, setSelectedCalendars] = useGTLocalStorage<TCalendarAccount[]>(
        'selectedCalendars',
        [],
        true
    )

    // update selected calendars when calendar accounts are added/removed
    useEffect(() => {
        if (!calendars) return

        const newAccounts = calendars.filter(
            (calendar) =>
                !selectedCalendars.find((selectedCalendar) => selectedCalendar.account_id === calendar.account_id)
        )

        const removedAccounts = selectedCalendars.filter(
            (selectedCalendar) => !calendars.find((calendar) => calendar.account_id === selectedCalendar.account_id)
        )

        if (!newAccounts.length && !removedAccounts.length) return

        // when a new account is added, select all calendars
        const newSelectedCalendars = [...selectedCalendars, ...newAccounts]
        removedAccounts.forEach((removedAccount) => {
            const index = newSelectedCalendars.findIndex(
                (newSelectedCalendar) => newSelectedCalendar.account_id === removedAccount.account_id
            )
            newSelectedCalendars.splice(index, 1)
        })
        setSelectedCalendars(newSelectedCalendars)
    }, [calendars?.length])

    // const toggleCalendar = (calendarId: string) => {
    //     if (selectedCalendars.includes(calendarId)) {
    //     setSelectedCalendars(selectedCalendars.filter((id) => id !== calendarId));
    //     } else {
    //     setSelectedCalendars([...selectedCalendars, calendarId]);
    //     }
    // };

    return { selectedCalendars }
}

export default useSelectedCalendars
