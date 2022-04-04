import React, { useCallback, useEffect } from 'react'

import ActionValue from '../atoms/ActionValue'
import { Icon } from '../atoms/Icon'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import { Spacing } from '../../styles'
import { TTask } from '../../utils/types'
import { icons } from '../../styles/images'
import styled from 'styled-components/native'
import { useClickOutside } from '../../utils/hooks'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'

import DatePicker from './DatePicker'
import LabelEditor from './LabelEditor'
import TimeEstimatePicker from './TimeEstimatePicker'

const ActionButton = styled.Pressable`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: ${Spacing.padding.xSmall}px;
    margin-right: ${Spacing.margin._8}px;
`

interface ActionOptionProps {
    task: TTask
    action: 'date_picker' | 'time_allocated' | 'label'
    isShown: boolean
    keyboardShortcut: KEYBOARD_SHORTCUTS
    setIsShown: (isShown: boolean) => void
}
const ActionOption = ({ task, action, isShown, keyboardShortcut, setIsShown }: ActionOptionProps) => {
    const actionRef = React.useRef<HTMLDivElement>(null)
    useClickOutside(actionRef, () => setIsShown(false))

    useEffect(() => {
        setIsShown(false)
    }, [task])

    const { icon, component, actionString } = ((action: 'date_picker' | 'time_allocated' | 'label') => {
        if (action === 'date_picker') {
            return {
                icon: icons.calendar_blank,
                component: (
                    <DatePicker task_id={task.id} due_date={task.due_date} closeDatePicker={() => setIsShown(false)} />
                ),
                actionString: task.due_date,
            }
        }
        else if (action === 'time_allocated') {
            return {
                icon: icons.timer,
                component: <TimeEstimatePicker task_id={task.id} closeTimeEstimate={() => setIsShown(false)} />,
                actionString:
                    task.time_allocated / 60000000 === 60000 || task.time_allocated / 60000000 === 0
                        ? ''
                        : `${task.time_allocated / 60000000}min`,
            }
        }
        else {
            return {
                icon: icons.label,
                component: <LabelEditor task_id={task.id} closeLabelEditor={() => setIsShown(false)} />,
                actionString: ''
            }
        }
    })(action)

    // show action when keyboardShortcut is pressed
    useKeyboardShortcut(keyboardShortcut, useCallback(() => setIsShown(!isShown), [isShown]))

    // when the action is shown, close action when KEYBOARD_SHORTCUTS.CLOSE is pressed
    useKeyboardShortcut(KEYBOARD_SHORTCUTS.CLOSE, useCallback(() => setIsShown(false), []), !isShown)

    return (
        <div ref={actionRef}>
            <ActionButton onPress={() => setIsShown(!isShown)}>
                {actionString ? <ActionValue value={actionString} /> : <Icon source={icon} size="small" />}
                {isShown && component}
            </ActionButton>
        </div>
    )
}

export default ActionOption
