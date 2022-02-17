import { DateTime } from 'luxon'
import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { EVENT_CONTAINER_COLOR, flex, GRAY_800 } from '../../helpers/styles'
import { dateIsToday, useInterval } from '../../helpers/utils'

import CalendarEvents from './CalendarEvents'
import CalendarHeader from './CalendarHeader'

const CalendarFullContainer = styled.div`
    flex: 1;
    background-color: ${EVENT_CONTAINER_COLOR};
    box-shadow: -5px 0px 20px 5px whitesmoke;
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
    color: ${GRAY_800};
    border-bottom: 1px solid ${GRAY_800};
`

export default function CalendarFull(): JSX.Element {
    const [date, setDate] = useState<DateTime>(DateTime.now())
    const [selectedDateIsToday, setSelectedDateIsToday] = useState<boolean>(true)

    // keep track of when the selected date is supposed to be today
    useEffect(() => {
        setSelectedDateIsToday(dateIsToday(date))
    }, [date])

    // check if the selected date is supposed to be today, but it isn't  (e.g. we passed midnight)
    useInterval(
        useCallback(() => {
            if (selectedDateIsToday && !dateIsToday(date)) {
                setDate(DateTime.now())
            }
        }, [date, selectedDateIsToday]),
        1,
        false
    )

    return (
        <CalendarFullContainer>
            <CalendarHeader date={date} setDate={setDate} />
            <flex.justifyContentSpaceAround>
                {Array(7)
                    .fill(0)
                    .map((_, i) => {
                        return <CalendarDayHeader>{date.plus({ days: i }).toFormat('ccc dd')}</CalendarDayHeader>
                    })}
            </flex.justifyContentSpaceAround>
            <WeekContainer>
                {Array(7)
                    .fill(0)
                    .map((_, i) => {
                        return (
                            <CalendarEvents
                                date={date.plus({ days: i })}
                                isToday={dateIsToday(date.plus({ days: i }))}
                                showTimes={i === 0}
                                scroll={false}
                            />
                        )
                    })}
            </WeekContainer>
        </CalendarFullContainer>
    )
}
