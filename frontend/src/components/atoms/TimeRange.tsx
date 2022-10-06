import { DateTime } from 'luxon'
import styled from 'styled-components'

const TimeRangeContainer = styled.span<{ wrapText: boolean }>`
    ${(props) => !props.wrapText && `white-space: nowrap;`}
`

interface TimeRangeProps {
    start: DateTime
    end: DateTime
    wrapText?: boolean
}
const TimeRange = ({ start, end, wrapText = true }: TimeRangeProps) => {
    const formattedStart = start.toLocaleString(DateTime.TIME_SIMPLE)
    const formattedEnd = end.toLocaleString(DateTime.TIME_SIMPLE)
    return <TimeRangeContainer wrapText={wrapText}>{`${formattedStart} – ${formattedEnd}`}</TimeRangeContainer>
}

export default TimeRange
