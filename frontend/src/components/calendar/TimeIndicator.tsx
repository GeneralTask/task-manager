import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { CALENDAR_INDICATOR_COLOR, CELL_HEIGHT } from '../../helpers/styles'

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
    const [time, setTime] = useState(new Date())
    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 6000)
        return () => clearInterval(interval)
    }, [])
    const hours = time.getHours() - 1
    const minutes = time.getMinutes()
    const topOffset = (60 * hours + minutes) * (CELL_HEIGHT / 60)
    return <TimeIndicatorContainer topOffset={topOffset} />
}
