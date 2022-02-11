import { DateTime } from 'luxon'
import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { EVENT_CONTAINER_COLOR } from '../../helpers/styles'
import { dateIsToday, useInterval } from '../../helpers/utils'

import CalendarEvents from './CalendarEvents'
import CalendarHeader from './CalendarHeader'

const CalendarFullContainer = styled.div`
    min-width: 475px;
    flex: 1;
    height: 100%;
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

enum CalendarViewType {
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
}

export default function CalendarFull(): JSX.Element {
    const [date, setDate] = useState<DateTime>(DateTime.now())
    const [selectedDateIsToday, setSelectedDateIsToday] = useState<boolean>(true)
    const [viewType, setViewType] = useState<CalendarViewType>(CalendarViewType.DAY)

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
            <WeekContainer>
                {
                    Array(7).fill(0).map((_, i) => {
                        return <CalendarEvents
                            date={date.plus({ days: i })}
                            isToday={dateIsToday(date.plus({ days: i }))}
                            showTimes={i === 0} />
                    })
                }
            </WeekContainer >
        </CalendarFullContainer>
    )
}
