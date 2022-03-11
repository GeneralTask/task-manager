import { DateTime } from 'luxon'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { CALENDAR_INDICATOR_COLOR, CELL_HEIGHT } from './CalendarEvents-styles'

interface TimeIndicatorContainerProps {
    topOffset: number
}
const TimeIndicatorContainer = styled.div<TimeIndicatorContainerProps>`
    width: 100%;
    background-color: ${CALENDAR_INDICATOR_COLOR};
    height: 1px;
    position: absolute;
    top: ${(props) => props.topOffset}px;
`

export function TimeIndicator(): JSX.Element {
    const [time, setTime] = useState(DateTime.now())
    useEffect(() => {
        const interval = setInterval(() => setTime(DateTime.now()), 6000)
        return () => clearInterval(interval)
    }, [])
    const topOffset = (60 * time.hour + time.minute) * (CELL_HEIGHT / 60)
    return <TimeIndicatorContainer topOffset={topOffset} />
}
