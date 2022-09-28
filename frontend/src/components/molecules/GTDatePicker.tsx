import { useState } from 'react'
import { useLayoutEffect } from 'react'
import { Calendar } from '@mantine/dates'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { TTextColor } from '../../styles/colors'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import GTPopover from '../radix/GTPopover'

const GTDatePickerWrapper = styled.div`
    display: flex;
    flex-direction: column;
    .mantine-Calendar-calendarHeaderLevel {
        color: ${Colors.text.light};
        ${Typography.eyebrow};
    }
    .mantine-Calendar-day {
        border-radius: 50%;
    }
`
const DateViewContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: ${Spacing._8};
    padding: ${Spacing._4} ${Spacing._8};
    gap: ${Spacing._8};
    border-radius: ${Border.radius.mini};
    border: ${Border.stroke.medium} solid ${Colors.border.light};
`
const getFormattedDate = (
    date: Date | null
): {
    dateString: string
    color: TTextColor
} => {
    if (!date || isNaN(+date) || +date === 0) {
        return { dateString: 'No due date', color: 'light' }
    }
    if (DateTime.fromJSDate(date).hasSame(DateTime.local(), 'day')) {
        return { dateString: 'Today', color: 'red' }
    }
    if (DateTime.fromJSDate(date).hasSame(DateTime.local().plus({ days: 1 }), 'day')) {
        return { dateString: 'Tomorrow', color: 'orange' }
    }
    if (DateTime.fromJSDate(date) < DateTime.local()) {
        return { dateString: 'Overdue', color: 'red' }
    }
    return { dateString: DateTime.fromJSDate(date).toFormat('LLL dd'), color: 'light' }
}

interface GTDatePickerProps {
    initialDate: Date
    setDate: (date: string) => void
    showIcon?: boolean
    onlyCalendar?: boolean
}
const GTDatePicker = ({ initialDate, setDate, showIcon = true, onlyCalendar = false }: GTDatePickerProps) => {
    const [value, onChange] = useState<Date | null>(initialDate)
    const [isOpen, setIsOpen] = useState(false)

    useLayoutEffect(() => {
        onChange(initialDate)
    }, [initialDate])

    const handleOnChange = (date: Date | null) => {
        onChange(date)
        if (date) {
            setDate(DateTime.fromJSDate(date).toISO())
        } else {
            setDate(DateTime.fromMillis(0).toISO())
        }
    }

    const calendar = (
        <GTDatePickerWrapper>
            <Calendar
                value={value}
                onChange={handleOnChange}
                placeholder="Select a Date"
                firstDayOfWeek="sunday"
                allowLevelChange={false}
                size="sm"
                dayStyle={(date, modifiers) => {
                    if (modifiers.selected) {
                        return {
                            backgroundColor: Colors.gtColor.primary,
                            color: Colors.text.white,
                        }
                    }
                    if (date.toDateString() === new Date().toDateString()) {
                        return {
                            backgroundColor: Colors.background.medium,
                        }
                    }
                    if (modifiers.outside) {
                        return {}
                    }
                    return { color: Colors.text.black }
                }}
            />
            <DateViewContainer>
                <Icon icon={icons.calendar_blank} size="small" color="black" />
                <span style={{ flex: 1 }}>
                    {!value || isNaN(+value) || +value === 0 ? 'No Due Date' : value?.toDateString()}
                </span>
                <GTIconButton icon={icons.x} size="small" color="black" onClick={() => handleOnChange(null)} />
            </DateViewContainer>
        </GTDatePickerWrapper>
    )

    if (onlyCalendar) return calendar

    return (
        <GTPopover
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            content={calendar}
            trigger={
                <GTButton
                    styleType="simple"
                    size="small"
                    icon={showIcon ? icons.timer : undefined}
                    value={getFormattedDate(value).dateString}
                    textColor={getFormattedDate(value).color}
                    onClick={() => setIsOpen(!isOpen)}
                />
            }
        />
    )
}

export default GTDatePicker
