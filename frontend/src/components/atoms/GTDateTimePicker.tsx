import React, { useState } from 'react'
import { View, Text } from 'react-native'
import DateTimePicker, { IOSNativeProps } from '@react-native-community/datetimepicker'

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
        <View>
            <DateTimePicker {...props} />
            <Text>{`${val.getHours()}H${val.getMinutes()}M`}</Text>
        </View>
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
        <View>
            <DateTimePicker {...props} />
            <Text>{`${val.toISOString()}`}</Text>
        </View>
    )
}
