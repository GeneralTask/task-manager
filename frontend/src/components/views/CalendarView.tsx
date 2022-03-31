import { DateTime } from 'luxon'
import React, { useState } from 'react'
import styled from 'styled-components'
import { Colors } from '../../styles'
import CalendarEvents from '../calendar/CalendarEvents'
import CalendarHeader from '../calendar/CalendarHeader'

const CalendarSidebarViewContainer = styled.div`
    min-width: 300px;
    height: 100vh;
    background-color: ${Colors.gray._100};
    border-left: 1px solid ${Colors.gray._200};
    display: flex;
    flex-direction: column;
`

const CalendarFullViewContainer = styled.div`
    flex: 1;
    background-color: ${Colors.gray._100};
    display: flex;
    flex-direction: column;
`

const WeekContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    flex: 1;
`
const CalendarDayHeader = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    height: 40px;
    font-size: 16px;
    font-weight: 600;
    color: ${Colors.gray._800};
    border-bottom: 1px solid ${Colors.gray._800};
`

const CalendarView = () => {
    const [date, setDate] = useState<DateTime>(DateTime.now())

    return (
        <CalendarFullViewContainer>
            <CalendarHeader date={date} setDate={setDate} />
            {/* <div style={{ justifyContent: 'space-around', flexDirection: 'row', display: 'flex', marginLeft: '40px' }}>
                {Array(7)
                    .fill(0)
                    .map((_, i) => {
                        return <CalendarDayHeader key={i}>{date.plus({ days: i }).toFormat('ccc dd')}</CalendarDayHeader>
                    })}
            </div> */}
            <CalendarEvents date={date} numDays={7} />
        </CalendarFullViewContainer>
    )
    return (
        <CalendarSidebarViewContainer>
            <CalendarHeader date={date} setDate={setDate} />
            <CalendarEvents date={date} numDays={1} />
        </CalendarSidebarViewContainer>
    )
}

export default CalendarView
