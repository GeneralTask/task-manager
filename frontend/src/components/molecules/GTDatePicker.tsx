import { useState } from 'react'
import { useLayoutEffect } from 'react'
import { Calendar } from '@mantine/dates'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Colors, Typography } from '../../styles'
import { TTextColor } from '../../styles/colors'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import GTPopover from '../radix/GTPopover'

const GTDatePickerWrapper = styled.div`
    .mantine-Calendar-calendarHeaderLevel {
        color: ${Colors.text.light};
        ${Typography.eyebrow};
    }
    .mantine-Calendar-day {
        border-radius: 50%;
    }
`
const getFormattedDate = (
    date: Date | null
): {
    dateString: string
    color: TTextColor
} => {
    if (!date || isNaN(+date)) return { dateString: 'No due date', color: 'light' }
    if (DateTime.fromJSDate(date).hasSame(DateTime.local(), 'day')) return { dateString: 'Today', color: 'red' }
    if (DateTime.fromJSDate(date).hasSame(DateTime.local().plus({ days: 1 }), 'day'))
        return { dateString: 'Tomorrow', color: 'orange' }
    if (DateTime.fromJSDate(date) < DateTime.local()) return { dateString: 'Overdue', color: 'red' }
    return { dateString: DateTime.fromJSDate(date).toFormat('LLL dd'), color: 'light' }
}

interface GTDatePickerProps {
    initialDate: Date
    setDate: (date: string) => void
    showIcon?: boolean
}
const GTDatePicker = ({ initialDate, setDate, showIcon = true }: GTDatePickerProps) => {
    const [value, onChange] = useState<Date | null>(initialDate)

    useLayoutEffect(() => {
        onChange(initialDate)
    }, [initialDate])

    const handleOnChange = (date: Date) => {
        onChange(date)
        setDate(DateTime.fromJSDate(date).toISO())
    }

    return (
        <GTPopover
            content={
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
                </GTDatePickerWrapper>
            }
            trigger={
                // TODO: change color based on Today, Tomorrow, etc.
                // <GTButton styleType="simple" size="small" icon={icons.timer} value={value?.toLocaleDateString()} />
                <GTButton
                    styleType="simple"
                    size="small"
                    icon={showIcon ? icons.timer : undefined}
                    value={getFormattedDate(value).dateString}
                    textColor={getFormattedDate(value).color}
                />
            }
        />
    )
}

export default GTDatePicker
