import DateTimePicker, { IOSNativeProps } from '@react-native-community/datetimepicker'
import React, { useState } from 'react'

interface TimePickerProps {
    initialValue?: Date
    onChange: (date: Date) => void
}
export const TimePicker = ({ initialValue, onChange }: TimePickerProps) => {
    const [val, setVal] = useState(initialValue || new Date(0))

    const props: IOSNativeProps = {
        value: val,
        mode: 'countdown',
        onChange: (_, date?: Date | undefined) => {
            const currentDate = date || val
            setVal(currentDate)
            onChange(currentDate)
        },
    }

    return (
        <div>
            <DateTimePicker {...props} />
            {`${val.getHours()}H${val.getMinutes()}M`}
        </div>
    )
}

interface DatePickerProps {
    initialValue?: Date
    onChange: (date: Date) => void
}
export const DatePicker = ({ initialValue, onChange }: DatePickerProps) => {
    const [val, setVal] = useState(initialValue || new Date())

    const props: IOSNativeProps = {
        value: val,
        mode: 'date',
        onChange: (_, date?: Date | undefined) => {
            const currentDate = date || val
            setVal(currentDate)
            onChange(currentDate)
        },
    }

    return (
        <div>
            <DateTimePicker {...props} />
            {`${val.toISOString()}`}
        </div>
    )
}
