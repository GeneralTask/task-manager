import { Calendar, DayModifiers } from '@mantine/dates'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../../styles'
import { RecurrenceRate } from '../../../../utils/enums'

const StyledCalendar = styled(Calendar)<{ disabled: boolean }>`
    /* width: 200px; */
    width: fit-content;
    margin: 0 ${Spacing._16};
    box-sizing: border-box;
    .mantine-Calendar-calendarBase {
        max-width: none;
    }
    thead {
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
        ${(props) =>
            props.disabled &&
            `
            background-color: transparent;
            cursor: default;
        `}
    }
    .selected {
        color: ${Colors.text.black};
        border-color: ${Colors.gtColor.primary};
        background-color: ${Colors.gtColor.secondary};
    }
    .recurring-selection {
        color: ${Colors.text.black};
        background-color: ${Colors.gtColor.secondary};
    }
`

interface DatePickerProps {
    date: DateTime
    setDate: (date: DateTime) => void
    recurrenceRate: RecurrenceRate
}
const DatePicker = ({ date, setDate, recurrenceRate }: DatePickerProps) => {
    const disabled = recurrenceRate === RecurrenceRate.DAILY || recurrenceRate === RecurrenceRate.WEEK_DAILY
    const selectedDate = disabled ? DateTime.local() : date
    const jsDate = selectedDate.toJSDate()

    const handleChange = (newDate: Date | null) => {
        if (disabled || !newDate) return
        setDate(DateTime.fromJSDate(newDate))
    }

    const applyDayClassNames = (day: Date, modifiers: DayModifiers) => {
        if (modifiers.selected) return 'selected'
        if (day.getTime() < jsDate.getTime()) return ''
        if (
            recurrenceRate === RecurrenceRate.DAILY ||
            (recurrenceRate === RecurrenceRate.WEEK_DAILY && !modifiers.weekend) ||
            (recurrenceRate === RecurrenceRate.WEEKLY && day.getDay() === date.weekday % 7) ||
            (recurrenceRate === RecurrenceRate.MONTHLY && day.getDate() === date.day)
        )
            return 'recurring-selection'
        return ''
    }

    return (
        <StyledCalendar
            value={jsDate}
            onChange={handleChange}
            firstDayOfWeek="sunday"
            dayClassName={applyDayClassNames}
            allowLevelChange={false}
            disabled={disabled}
        />
    )
}

export default DatePicker
