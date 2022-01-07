import React, { useState } from 'react'
import { useAppSelector } from '../../redux/hooks'
import CalendarEvents from './CalendarEvents'
import CalendarHeader from './CalendarHeader'
import { CalendarSidebarContainer } from './CalendarHeader-styles'

export default function CalendarSidebar(): JSX.Element {
    const [date, setDate] = useState<Date>(new Date())
    const calendarSidebarShown = useAppSelector((state) => state.tasks_page.events.show_calendar_sidebar)

    if (!calendarSidebarShown) {
        return <></>
    }
    return (
        <CalendarSidebarContainer>
            <CalendarHeader date={date} setDate={setDate} />
            <CalendarEvents date={date} />
        </CalendarSidebarContainer>
    )
}
