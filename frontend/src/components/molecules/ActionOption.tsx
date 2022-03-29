import React, { useEffect } from 'react'

import ActionValue from '../atoms/ActionValue'
import DatePicker from './DatePicker'
import { Icon } from '../atoms/Icon'
import { InvisibleKeyboardShortcut } from '../atoms/KeyboardShortcuts'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import { Spacing } from '../../styles'
import { TTask } from '../../utils/types'
import TimeEstimatePicker from './TimeEstimatePicker'
import { icons } from '../../styles/images'
import styled from 'styled-components/native'

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
    keyboardShortcut?: KEYBOARD_SHORTCUTS
    setIsShown: (isShown: boolean) => void
}
const ActionOption = ({ task, action, isShown, keyboardShortcut, setIsShown }: ActionOptionProps) => {
    useEffect(() => {
        setIsShown(false)
    }, [task])

    const { icon, component, actionString } = ((action: 'date_picker' | 'time_allocated') => {
        if (action === 'date_picker') {
            return {
                icon: icons.calendar_blank,
                component: (
                    <DatePicker task_id={task.id} due_date={task.due_date} closeDatePicker={() => setIsShown(false)} />
                ),
                actionString: task.due_date,
            }
        }
        return {
            icon: icons.timer,
            component: <TimeEstimatePicker task_id={task.id} closeTimeEstimate={() => setIsShown(false)} />,
            actionString:
                task.time_allocated / 60000000 === 60000 || task.time_allocated / 60000000 === 0
                    ? ''
                    : `${task.time_allocated / 60000000}min`,
        }
    })(action)

    return (
        <ActionButton onPress={() => setIsShown(!isShown)}>
            {actionString ? <ActionValue value={actionString} /> : <Icon source={icon} size="small" />}
            {isShown && component}
            {keyboardShortcut && (
                <InvisibleKeyboardShortcut shortcut={keyboardShortcut} onKeyPress={() => setIsShown(!isShown)} />
            )}
            {isShown && (
                <InvisibleKeyboardShortcut shortcut={KEYBOARD_SHORTCUTS.CLOSE} onKeyPress={() => setIsShown(false)} />
            )}
        </ActionButton>
    )
}

export default ActionOption
