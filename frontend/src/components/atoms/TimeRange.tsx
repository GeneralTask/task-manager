import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Colors, Typography } from '../../styles'

const TimeContainer = styled.div`
    display: flex;
    flex-direction: row;
`
const TimeText = styled.span`
    color: ${Colors.text.light};
    ${Typography.label};
    ${Typography.bold};
`
interface TimeRangeProps {
    start: DateTime
    end: DateTime
}
const TimeRange = ({ start, end }: TimeRangeProps) => {
    const formattedStart = start.toLocaleString(DateTime.TIME_SIMPLE)
    const formattedEnd = end.toLocaleString(DateTime.TIME_SIMPLE)
    return (
        <TimeContainer>
            <TimeText>{formattedStart + ' - ' + formattedEnd}</TimeText>
        </TimeContainer>
    )
}

export default TimeRange
