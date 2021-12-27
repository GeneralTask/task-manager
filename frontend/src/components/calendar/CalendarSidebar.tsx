import React, { useState } from 'react'
import styled from 'styled-components'
import { EVENT_CONTAINER_COLOR } from '../../helpers/styles'
import CalendarEvents from './CalendarEvents'
import CalendarHeader from './CalendarHeader'

const CalendarSidebarContainer = styled.div`
    min-width: 475px;
    height: 100%;
    background-color: ${EVENT_CONTAINER_COLOR};
    box-shadow: -5px 0px 20px 5px whitesmoke;
    display: flex;
    flex-direction: column;
    overflow: scroll;
`
export default function CalendarSidebar(): JSX.Element {
    const [date, setDate] = useState<Date>(new Date())

    return (
        <CalendarSidebarContainer>
            <CalendarHeader date={date} setDate={setDate} />
            <CalendarEvents date={date} />
        </CalendarSidebarContainer>
    )
}
