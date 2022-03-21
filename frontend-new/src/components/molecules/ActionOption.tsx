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
    padding: ${Spacing.padding.xSmall}px;
    margin-right: ${Spacing.margin.small}px;
`

interface ActionOptionProps {
    task: TTask
    action: 'date_picker' | 'time_allocated'
    isShown: boolean
    setIsShown: (isShown: boolean) => void
}
const ActionOption = ({ task, action, isShown, setIsShown }: ActionOptionProps) => {
    useEffect(() => {
        setIsShown(false)
    }, [task])

    const actionSpecificValues = ((action: 'date_picker' | 'time_allocated') => {
        if (action === 'date_picker') {
            return {
                icon: icons.calendar_blank,
                component: (
                    <DatePicker task_id={task.id} due_date={task.due_date} closeDatePicker={() => setIsShown(false)} />
                ),
                string: task.due_date,
            }
        }
        return {
            icon: icons.timer,
            component: <TimeEstimatePicker task_id={task.id} closeTimeEstimate={() => setIsShown(false)} />,
            string: task.time_allocated / 60000000 === 60000 ? '' : `${task.time_allocated / 60000000}min`,
        }
    })(action)

    return (
        <ActionButton onPress={() => setIsShown(!isShown)}>
            {actionSpecificValues.string ? (
                <ActionValue value={actionSpecificValues.string} />
            ) : (
                <Icon source={actionSpecificValues.icon} size="small" />
            )}
            {isShown && actionSpecificValues.component}
        </ActionButton>
    )
}

export default ActionOption
