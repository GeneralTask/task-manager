import { DateTime } from 'luxon'
import React, { useState } from 'react'
import styled from 'styled-components'
import { Colors } from '../../styles'

import CalendarEvents from './CalendarEvents'
import CalendarHeader from './CalendarHeader'

const CalendarFullContainer = styled.div`
    flex: 1;
    background-color: ${Colors.background.primary};
    display: flex;
    flex-direction: column;
`

const WeekContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    overflow-y: scroll;
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

export default function CalendarFull(): JSX.Element {
    const [date, setDate] = useState<DateTime>(DateTime.now())

    return (
        <CalendarFullContainer>
            <CalendarHeader date={date} setDate={setDate} />
            <div style={{ flex: 1, justifyContent: 'space-around' }}>
                {Array(7)
                    .fill(0)
                    .map((_, i) => {
                        return <CalendarDayHeader>{date.plus({ days: i }).toFormat('ccc dd')}</CalendarDayHeader>
                    })}
            </div>
            <WeekContainer>
                {Array(7)
                    .fill(0)
                    .map((_, i) => {
                        return (
                            <CalendarEvents
                                date={date.plus({ days: i })}
                                isToday={date.plus({ days: i }).day === DateTime.now().day}
                                showTimes={i === 0}
                                scroll={false}
                            />
                        )
                    })}
            </WeekContainer>
        </CalendarFullContainer>
    )
}

