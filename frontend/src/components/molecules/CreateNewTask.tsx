import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { Colors, Dimensions, Images, Typography, Border, Spacing } from '../../styles'
import { Icon } from '../atoms/Icon'
import KeyboardShortcut from '../atoms/KeyboardShortcut'

const CreateNewTaskContainer = styled.div`
    display: flex;
    flex-shrink: 0;
    flex-direction: row;
    gap: ${Spacing.padding._8};
    background-color: ${Colors.background.medium};
    height: ${Dimensions.TASK_HEIGHT};
    align-items: center;
    padding: 0px ${Spacing.padding._8};
    border-radius: ${Border.radius.large};
    margin-bottom: ${Spacing.padding._8};
`
const TaskInput = styled.input`
    border: none;
    outline: none;
    background-color: transparent;
    flex: 1;
    ${Typography.bodySmall};
`

interface CreateNewTaskProps {
    onCreateTask: (title: string) => void
    disableKeyboardShortcut?: boolean
}
const CreateNewTask = ({ onCreateTask, disableKeyboardShortcut }: CreateNewTaskProps) => {
    const [text, setText] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const submitNewTask = async () => {
        if (!text) return
        else {
            setText('')
            onCreateTask(text)
        }
    }
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') inputRef.current?.blur()
        else e.stopPropagation()
        if (e.key === 'Enter') submitNewTask()
        else if (e.key === 'Escape') inputRef.current?.blur()
    }
    return (
        <CreateNewTaskContainer>
            <Icon source={Images.icons.plus} size={'small'} />
            <TaskInput
                ref={inputRef}
                value={text}
                placeholder="Add new task"
                onKeyDown={handleKeyDown}
                onChange={(e) => setText(e.target.value)}
            />
            {!disableKeyboardShortcut && (
                <KeyboardShortcut shortcut="createTask" onKeyPress={() => inputRef.current?.focus()} />
            )}
        </CreateNewTaskContainer>
    )
}

export default CreateNewTask
