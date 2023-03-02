import { forwardRef, useCallback, useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { TIME_INDICATOR_INTERVAL } from '../../constants'
import { useInterval } from '../../hooks'
import { Colors } from '../../styles'
import { CELL_HEIGHT_VALUE } from './CalendarEvents-styles'

const INDICATOR_HEIGHT = 1
const DOT_SIZE = 6

interface TimeIndicatorContainerProps {
    topOffset: number
    hideDot: boolean
}
const TimeIndicatorContainer = styled.div.attrs(({ topOffset }: TimeIndicatorContainerProps) => ({
    style: {
        top: topOffset,
    },
}))<TimeIndicatorContainerProps>`
    width: 100%;
    background-color: ${Colors.legacyColors.orange};
    height: ${INDICATOR_HEIGHT}px;
    position: absolute;
    ${({ hideDot }) =>
        !hideDot &&
        `::before {
        content: '';
        position: absolute;
        width: ${DOT_SIZE}px;
        height: ${DOT_SIZE}px;
        border-radius: 50%;
        background-color: ${Colors.legacyColors.orange};
        top: -${(DOT_SIZE - INDICATOR_HEIGHT) / 2}px;
        left: 0;
    }`}
    pointer-events: none;
`
interface TimeIndicatorProps {
    hideDot?: boolean
}
export const TimeIndicator = forwardRef<HTMLDivElement, TimeIndicatorProps>(({ hideDot = false }, ref) => {
    const [time, setTime] = useState(DateTime.now())
    useInterval(
        useCallback(() => setTime(DateTime.now()), []),
        TIME_INDICATOR_INTERVAL
    )

    const topOffset = (60 * time.hour + time.minute) * (CELL_HEIGHT_VALUE / 60)
    return <TimeIndicatorContainer topOffset={topOffset} hideDot={hideDot} ref={ref} />
})
