import { useState } from 'react'
import { useLayoutEffect } from 'react'
import { Calendar } from '@mantine/dates'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Colors, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { getFormattedDate } from '../../utils/utils'
import GTButton from '../atoms/buttons/GTButton'
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

    const handleOnChange = (date: Date) => {
        onChange(date)
        setDate(DateTime.fromJSDate(date).toISO())
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
