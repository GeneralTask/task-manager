import { useState } from 'react'
import { Calendar } from '@mantine/dates'
import styled from 'styled-components'
import { Colors, Typography } from '../../styles'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import GTPopover from '../radix/GTPopover'

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

    return (
        <GTDatePickerWrapper>
            <GTPopover
                content={
                    <Calendar
                        value={value}
                        onChange={onChange}
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
                }
                trigger={
                    <GTButton styleType="simple" size="small" icon={icons.timer} value={value?.toLocaleDateString()} />
                }
            />
        </GTDatePickerWrapper>
    )
}

export default GTDatePicker
