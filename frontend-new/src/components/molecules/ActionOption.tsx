import React, { useEffect } from 'react'
import styled from 'styled-components/native'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { TTask } from '../../utils/types'
import ActionValue from '../atoms/ActionValue'
import { Icon } from '../atoms/Icon'
import DatePicker from './DatePicker'
import TimeEstimatePicker from './TimeEstimatePicker'

const ActionButton = styled.Pressable`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 2px;
    margin-right: ${Spacing.margin.small}px;
`
interface ActionOptionProps {
    task: TTask
    action: 'date_picker' | 'time_allocated'
}
const ActionOption = ({ task, action }: ActionOptionProps) => {
    const [isPickerVisible, setIsPickerVisible] = React.useState(false)
    useEffect(() => {
        setIsPickerVisible(false)
    }, [task])

    const icon = action === 'date_picker' ? icons.calendar_blank : icons.timer
    const picker =
        action === 'date_picker' ? (
            <DatePicker task_id={task.id} due_date={task.due_date} closeDatePicker={() => setIsPickerVisible(false)} />
        ) : (
            <TimeEstimatePicker task_id={task.id} closeTimeEstimate={() => setIsPickerVisible(false)} />
        )
    const setValue = action === 'date_picker' ? task.due_date : `${task.time_allocated / 60000000}min`
    return (
        <ActionButton onPress={() => setIsPickerVisible(!isPickerVisible)}>
            {setValue ? <ActionValue value={setValue} /> : <Icon source={icon} size="small" />}
            {isPickerVisible && picker}
        </ActionButton>
    )
}

export default ActionOption
