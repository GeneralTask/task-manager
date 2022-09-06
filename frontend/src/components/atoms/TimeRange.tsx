import { DateTime } from 'luxon'
import React from 'react'
import styled from 'styled-components'
import { Colors, Typography } from '../../styles'

const TimeContainer = styled.div`
    display: flex;
    flex-direction: row;
`
const TimeText = styled.span`
    color: ${Colors.text.light};
    ${Typography.tag}
`
interface TimeRangeProps {
    start: Date
    end: Date
}
const TimeRange = ({ start, end }: TimeRangeProps) => {
    const formattedStart = DateTime.fromJSDate(start).toLocaleString(DateTime.TIME_SIMPLE)
    const formattedEnd = DateTime.fromJSDate(end).toLocaleString(DateTime.TIME_SIMPLE)
    return (
        <TimeContainer>
            <TimeText>{formattedStart + '-' + formattedEnd}</TimeText>
        </TimeContainer>
    )
}

export default TimeRange
