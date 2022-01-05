import React, { useState } from 'react'
import CalendarEvents from './CalendarEvents'
import CalendarHeader from './CalendarHeader'
import { CalendarSidebarContainer } from './CalendarHeader-styles'

interface Props {
    setCalendarSidebarShown: (b: boolean) => void,
}
export default function CalendarSidebar(props: Props): JSX.Element {
    const [date, setDate] = useState<Date>(new Date())

    return (
        <CalendarSidebarContainer>
            <CalendarHeader date={date} setDate={setDate} setIsShown={props.setCalendarSidebarShown} />
            <CalendarEvents date={date} />
        </CalendarSidebarContainer>
    )
}
