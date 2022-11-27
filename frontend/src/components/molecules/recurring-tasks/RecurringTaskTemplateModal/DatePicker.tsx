import { Calendar, DayModifiers } from '@mantine/dates'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../../styles'
import { RecurrenceRate } from '../../../../utils/enums'

const StyledCalendar = styled(Calendar)`
    margin: 0 ${Spacing._16};
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
        border: ${Border.stroke.medium} solid transparent;
        border-radius: 50%;
        width: ${Spacing._24};
        height: ${Spacing._24};
        margin: ${Spacing._4};
        display: flex;
        align-items: center;
        justify-content: center;
        outline: none;
    }
    .selected {
        border-color: ${Colors.gtColor.primary};
        background-color: ${Colors.gtColor.secondary};
        color: ${Colors.text.black};
        box-sizing: border-box;
    }
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

    const applyDayClassNames = (_day: Date, modifiers: DayModifiers) => {
        if (modifiers.selected) {
            return 'selected'
        }
        return ''
    }

    return (
        <StyledCalendar
            value={jsDate}
            onChange={handleChange}
            firstDayOfWeek="sunday"
            dayClassName={applyDayClassNames}
            allowLevelChange={false}
        />
    )
}

export default DatePicker
