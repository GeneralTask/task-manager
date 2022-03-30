import React, { useEffect } from 'react'
import styled from 'styled-components/native'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { TTask, TTaskSection } from '../../utils/types'
import ActionValue from '../atoms/ActionValue'
import { Icon } from '../atoms/Icon'
import { InvisibleKeyboardShortcut } from '../atoms/KeyboardShortcuts'
import DatePicker from './DatePicker'
import LabelEditor from './LabelEditor'
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
    section: TTaskSection
    action: 'date_picker' | 'time_allocated' | 'label'
    isShown: boolean
    keyboardShortcut?: KEYBOARD_SHORTCUTS
    setIsShown: (isShown: boolean) => void
}
const ActionOption = ({ task, section, action, isShown, keyboardShortcut, setIsShown }: ActionOptionProps) => {
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
                component: <LabelEditor task_id={task.id} current_section_id={section.id} closeLabelEditor={() => setIsShown(false)} />,
                actionString: ''
            }
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
