import { useRef, useState } from 'react'
import { DatePicker } from '@mantine/dates'
import styled from 'styled-components'
import { Colors, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'

const GTDatePickerWrapper = styled.div`
    .mantine-DatePicker-calendarHeaderLevel {
        color: ${Colors.text.light};
        ${Typography.eyebrow};
    }
    .mantine-DatePicker-day {
        border-radius: 50%;
    }
`

const GTDatePicker = () => {
    const [value, onChange] = useState<Date | null>(new Date())
    const inputRef = useRef<HTMLInputElement>(null)

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (inputRef.current && (e.key === 'Escape' || e.key === 'Enter')) inputRef.current.blur()
        e.stopPropagation()
    }

    return (
        <GTDatePickerWrapper>
            <DatePicker
                ref={inputRef}
                value={value}
                onChange={onChange}
                placeholder="Select a Date"
                firstDayOfWeek="sunday"
                allowLevelChange={false}
                allowFreeInput
                icon={<Icon icon={icons.calendar_blank} size="xSmall" />}
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
                closeCalendarOnChange={false}
                onKeyDown={handleKeyDown}
            />
        </GTDatePickerWrapper>
    )
}

export default GTDatePicker
