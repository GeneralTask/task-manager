import { CSSProperties } from 'react'
import { Calendar, DayModifiers } from '@mantine/dates'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../../styles'
import { RecurrenceRate } from '../../../../utils/enums'

const StyledCalendar = styled(Calendar)`
    .mantine-Calendar-calendarBase {
        max-width: none;
    }
    .mantine-Calendar-calendarHeader {
        border-bottom: ${Border.stroke.medium} solid ${Colors.border.light};
    }
    .mantine-Calendar-calendarHeaderLevel {
        color: ${Colors.text.light};
        ${Typography.eyebrow};
    }
    .mantine-Text-root {
        ${Typography.label};
    }
    .mantine-Calendar-day {
        color: ${Colors.text.black};
        border-radius: 50%;
        width: ${Spacing._24};
        height: ${Spacing._24};
        margin: ${Spacing._4};
        display: flex;
        align-items: center;
        justify-content: center;
    }
`

const CalendarContainer = styled.div`
    margin: 0 auto;
    padding: 0 ${Spacing._16};
`

interface DatePickerProps {
    date: DateTime
    setDate: (date: DateTime) => void
    recurrenceRate: RecurrenceRate
}
const DatePicker = ({ date, setDate }: DatePickerProps) => {
    const jsDate = date.toJSDate()

    const handleChange = (newDate: Date | null) => {
        if (!newDate) return
        setDate(DateTime.fromJSDate(newDate))
    }

    const handleDayStyle = (_day: Date, modifiers: DayModifiers): CSSProperties => {
        if (modifiers.selected) {
            return {
                border: `${Border.stroke.medium} solid ${Colors.gtColor.primary}`,
                backgroundColor: Colors.gtColor.secondary,
                color: Colors.text.black,
                boxSizing: 'border-box',
            }
        }
        return {}
    }

    return (
        <CalendarContainer>
            <StyledCalendar
                value={jsDate}
                onChange={handleChange}
                firstDayOfWeek="sunday"
                dayStyle={handleDayStyle}
                allowLevelChange={false}
            />
        </CalendarContainer>
    )
}

export default DatePicker
