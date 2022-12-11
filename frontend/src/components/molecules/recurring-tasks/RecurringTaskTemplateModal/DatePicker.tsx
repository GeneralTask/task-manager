import { useState } from 'react'
import { Calendar, DayModifiers } from '@mantine/dates'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../../styles'
import { RecurrenceRate } from '../../../../utils/enums'
import GTButton from '../../../atoms/buttons/GTButton'

const Container = styled.div`
    padding-left: ${Spacing._16};
    box-sizing: border-box;
    width: 50%;
`
const MonthButton = styled(GTButton)<{ visible: boolean }>`
    visibility: ${(props) => (props.visible ? 'visible' : 'hidden')};
    margin-bottom: ${Spacing._4};
`
const StyledCalendar = styled(Calendar)<{ disabled: boolean }>`
    height: 250px;
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
    [data-selected='true'] {
        color: ${Colors.text.black};
        background-color: inherit;
    }
    .today {
        color: ${Colors.text.black};
        border-color: ${Colors.gtColor.primary};
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
    const [calendarDate, setCalendarDate] = useState(date.toJSDate())
    const disabled = recurrenceRate === RecurrenceRate.DAILY || recurrenceRate === RecurrenceRate.WEEK_DAILY
    const selectedDate = disabled ? DateTime.local() : date
    const jsDate = selectedDate.toJSDate()
    const today = new Date()

    const handleChange = (newDate: Date | null) => {
        if (disabled || !newDate) return
        setDate(DateTime.fromJSDate(newDate))
    }

    const applyDayClassNames = (day: Date, modifiers: DayModifiers) => {
        // show selected day ONLY in MONTHLY OR YEARLY mode
        if (
            modifiers.selected &&
            (recurrenceRate === RecurrenceRate.MONTHLY || recurrenceRate === RecurrenceRate.YEARLY)
        )
            return 'selected'

        // show today
        if (
            day.getDate() === today.getDate() &&
            day.getMonth() === today.getMonth() &&
            day.getFullYear() === today.getFullYear()
        )
            return 'today'

        // if DAILY or WEEK_DAILY, show highlight on all days after today
        if (
            (recurrenceRate === RecurrenceRate.DAILY ||
                recurrenceRate === RecurrenceRate.WEEK_DAILY ||
                recurrenceRate === RecurrenceRate.WEEKLY) &&
            day.getTime() < today.getTime()
        ) {
            return ''
        }

        if (
            recurrenceRate === RecurrenceRate.DAILY ||
            (recurrenceRate === RecurrenceRate.WEEK_DAILY && !modifiers.weekend) ||
            (recurrenceRate === RecurrenceRate.WEEKLY && day.getDay() === date.weekday % 7) ||
            (recurrenceRate === RecurrenceRate.MONTHLY && day.getDate() === date.day) ||
            (recurrenceRate === RecurrenceRate.YEARLY &&
                day.getMonth() === date.month - 1 &&
                day.getDate() === date.day)
        )
            return 'recurring-selection'
        return ''
    }

    return (
        <Container>
            <MonthButton
                visible={
                    calendarDate.getMonth() !== new Date().getMonth() ||
                    calendarDate.getFullYear() !== new Date().getFullYear()
                }
                styleType="secondary"
                size="small"
                value="Return to this month"
                onClick={() => setCalendarDate(new Date())}
            />
            <StyledCalendar
                value={jsDate}
                onChange={handleChange}
                firstDayOfWeek="sunday"
                dayClassName={applyDayClassNames}
                allowLevelChange={false}
                disabled={disabled}
                month={calendarDate}
                onMonthChange={setCalendarDate}
                fullWidth
            />
        </Container>
    )
}

export default DatePicker
