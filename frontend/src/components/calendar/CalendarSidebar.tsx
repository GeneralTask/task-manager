import React, { useState } from 'react'
import CalendarEvents from './CalendarEvents'
import CalendarHeader from './CalendarHeader'
import { CalendarSidebarContainer, HoverButton, Icon } from './CalendarHeader-styles'


export default function CalendarSidebar(): JSX.Element {
    const [date, setDate] = useState<Date>(new Date())
    const [isShown, setIsShown] = useState<boolean>(true)

    if (!isShown) {
        return <HoverButton onClick={() => setIsShown(false)}>
            <Icon src="images/collapse.svg" alt="Collapse calendar" />
        </HoverButton>
    }

    return (
        <CalendarSidebarContainer>
            <CalendarHeader date={date} setDate={setDate} setIsShown={setIsShown} />
            <CalendarEvents date={date} />
        </CalendarSidebarContainer>
    )
}
