import { DateTime } from 'luxon'

interface TimeRangeProps {
    start: DateTime
    end: DateTime
}
const TimeRange = ({ start, end }: TimeRangeProps) => {
    const formattedStart = start.toLocaleString(DateTime.TIME_SIMPLE)
    const formattedEnd = end.toLocaleString(DateTime.TIME_SIMPLE)
    return <span>{`${formattedStart} – ${formattedEnd}`}</span>
}

export default TimeRange
