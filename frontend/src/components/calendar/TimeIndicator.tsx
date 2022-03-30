import React, { useState } from 'react'

import { CELL_HEIGHT } from './CalendarEvents-styles'
import { Colors } from '../../styles'
import { DateTime } from 'luxon'
import { TIME_INDICATOR_INTERVAL } from '../../constants'
import styled from 'styled-components'
import { useInterval } from '../../utils/hooks'

interface TimeIndicatorContainerProps {
    topOffset: number
}
const TimeIndicatorContainer = styled.div<TimeIndicatorContainerProps>`
    width: 100%;
    background-color: ${Colors.purple._1};
    height: 1px;
    position: absolute;
    top: ${(props) => props.topOffset}px;
`

export function TimeIndicator(): JSX.Element {
    const [time, setTime] = useState(DateTime.now())
    useInterval(() => setTime(DateTime.now()), TIME_INDICATOR_INTERVAL)

    const topOffset = (60 * time.hour + time.minute) * (CELL_HEIGHT / 60)
    return <TimeIndicatorContainer topOffset={topOffset} />
}
