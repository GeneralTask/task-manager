import { useState } from 'react'
import { Calendar, DayModifiers } from '@mantine/dates'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../../styles'
import { icons } from '../../../../styles/images'
import { RecurrenceRate } from '../../../../utils/enums'
import Flex from '../../../atoms/Flex'
import GTButton from '../../../atoms/buttons/GTButton'
import { BodySmall, BodySmallUpper } from '../../../atoms/typography/Typography'

const Container = styled.div`
    width: 250px;
    padding-left: ${Spacing._16};
    box-sizing: border-box;
`
const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${Spacing._4};
`
const ReturnToCurrentMonthButton = styled(GTButton)<{ visible: boolean }>`
    visibility: ${(props) => (props.visible ? 'visible' : 'hidden')};
`
const MonthLabel = styled(BodySmallUpper)`
    margin-left: ${Spacing._32};
`
const StyledCalendar = styled(Calendar)<{ disabled: boolean }>`
    height: 220px;
    .mantine-Calendar-calendarBase {
        max-width: none;
    }
    thead {
        border-bottom: ${Border.stroke.medium} solid ${Colors.background.border};
        margin-bottom: 40px;
    }
    .mantine-Calendar-calendarHeader {
        display: none;
    }
    .mantine-Calendar-calendarHeaderLevel {
        color: ${Colors.text.light};
        text-transform: uppercase;
        ${Typography.body.small};
    }
    .mantine-Text-root {
        ${Typography.body.small};
    }
    .mantine-Calendar-day {
        color: ${Colors.text.black};
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
        background-color: inherit;
    }
    [data-outside='true'] {
        color: ${Colors.text.light};
    }
    .today {
        background-color: ${Colors.legacyColors.purple};
        color: white;
    }
    .selected {
        border-color: ${Colors.legacyColors.purple};
        background-color: ${Colors.legacyColors.secondary};
    }
    .recurring-past {
        border-color: ${Colors.legacyColors.purple};
    }
    .recurring-selection {
        background-color: ${Colors.legacyColors.secondary};
    }
`
const HelpText = styled(BodySmall)<{ show: boolean }>`
    margin-left: ${Spacing._4};
    color: ${Colors.text.light};
    visibility: ${(props) => (props.show ? 'visible' : 'hidden')};
`

interface DatePickerProps {
    date: DateTime
    setDate: (date: DateTime) => void
    recurrenceRate: RecurrenceRate
}
const DatePicker = ({ date, setDate, recurrenceRate }: DatePickerProps) => {
    const [calendarDate, setCalendarDate] = useState(DateTime.local())
    const disabled = recurrenceRate === RecurrenceRate.DAILY || recurrenceRate === RecurrenceRate.WEEK_DAILY
    const selectedDate = disabled ? DateTime.local() : date
    const jsDate = selectedDate.toJSDate()
    const today = new Date()

    const handleChange = (newDate: Date | null) => {
        if (disabled || !newDate) return
        setDate(DateTime.fromJSDate(newDate))
    }

    const applyDayClassNames = (day: Date, modifiers: DayModifiers) => {
        // show today
        if (
            day.getDate() === today.getDate() &&
            day.getMonth() === today.getMonth() &&
            day.getFullYear() === today.getFullYear()
        )
            return 'today'

        // show selected day ONLY in MONTHLY OR YEARLY mode
        if (
            modifiers.selected &&
            (recurrenceRate === RecurrenceRate.MONTHLY || recurrenceRate === RecurrenceRate.YEARLY)
        ) {
            if (day.getTime() < today.getTime()) {
                return 'recurring-past'
            }
            return 'selected'
        }

        // do not show recurring indica
        if (day.getTime() < today.getTime()) {
            return ''
        }

        if (
            day.getTime() > today.getTime() &&
            (recurrenceRate === RecurrenceRate.DAILY ||
                (recurrenceRate === RecurrenceRate.WEEK_DAILY && !modifiers.weekend) ||
                (recurrenceRate === RecurrenceRate.WEEKLY && day.getDay() === date.weekday % 7) ||
                (recurrenceRate === RecurrenceRate.MONTHLY && day.getDate() === date.day) ||
                (recurrenceRate === RecurrenceRate.YEARLY &&
                    day.getMonth() === date.month - 1 &&
                    day.getDate() === date.day))
        )
            return 'recurring-selection'
        return ''
    }

    return (
        <Container>
            <Header>
                <ReturnToCurrentMonthButton
                    styleType="icon"
                    icon={icons.calendar_star}
                    tooltipText="Return to current month"
                    visible={calendarDate.month !== today.getMonth() + 1 || calendarDate.year !== today.getFullYear()}
                    onClick={() => setCalendarDate(DateTime.local())}
                />
                <MonthLabel color="light">{calendarDate.toFormat('LLL yyyy')}</MonthLabel>
                <Flex>
                    <GTButton
                        styleType="icon"
                        icon={icons.arrow_left}
                        tooltipText="Previous month"
                        onClick={() => setCalendarDate(calendarDate.minus({ month: 1 }))}
                    />
                    <GTButton
                        styleType="icon"
                        icon={icons.arrow_right}
                        tooltipText="Next month"
                        onClick={() => setCalendarDate(calendarDate.plus({ month: 1 }))}
                    />
                </Flex>
            </Header>
            <StyledCalendar
                value={jsDate}
                onChange={handleChange}
                firstDayOfWeek="sunday"
                dayClassName={applyDayClassNames}
                allowLevelChange={false}
                disabled={disabled}
                month={calendarDate.toJSDate()}
                onMonthChange={(newDate) => setCalendarDate(DateTime.fromJSDate(newDate))}
                fullWidth
            />
            <HelpText show={!disabled}>Click to select a date on the calendar</HelpText>
        </Container>
    )
}

export default DatePicker
