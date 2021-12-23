import React, { useState } from 'react'
import * as styles from './DatePicker-style'
import { useAppSelector } from '../../../redux/hooks'

export type DatePickerProps = {
    onChange?: (date: Date) => void;
    value?: Date;
    minDate?: Date;
    maxDate?: Date;
}

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
    (
        {
            onChange,
            value = new Date(),
            minDate = new Date(0),
            maxDate,
            ...props
        },
        ref
    ) => {
        const [isOpen, setIsOpen] = useState(false)
        const [selectedDate, setSelectedDate] = useState(value)

        const showDatePicker = useAppSelector(state => state.tasks_page.show_date_picker)

        const handleDateChange = (date: Date) => {
            setSelectedDate(date)
            if (onChange) {
                onChange(date)
            }
        }

        const handleOpen = () => {
            setIsOpen(true)
        }

        const handleClose = () => {
            setIsOpen(false)
        }

        const handleClickOutside = () => {
            setIsOpen(false)
        }

        const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Enter') {
                handleClose()
            }
        }

        return (
            <div ref={ref} {...props}>
                <styles.DatePickerContainer>
                    <styles.DatePickerInput
                        onClick={handleOpen}
                        onKeyDown={handleKeyDown}
                        value={selectedDate.toLocaleDateString()}
                    />
                    {isOpen && (
                        <styles.DatePickerContainer>
                            <styles.DatePickerCalendar
                                minDate={minDate}
                                maxDate={maxDate}
                                onChange={handleDateChange}
                                value={selectedDate}
                            />
                        </styles.DatePickerContainer>
                    )}
                </styles.DatePickerContainer>
                {showDatePicker && (
                    <styles.DatePickerContainer>
                        <styles.DatePickerCalendar
                            minDate={minDate}
                            maxDate={maxDate}
                            onChange={handleDateChange}
                            value={selectedDate}
                        />
                    </styles.DatePickerContainer>
                )}
            </div>
        )
    }
)

export default DatePicker