import { faPlus } from '@fortawesome/pro-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { useCreateTask } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography, Dimensions } from '../../styles'
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
    border-radius: ${Border.radius.medium};
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
    sectionId: string
    disableKeyboardShortcut?: boolean
}
const CreateNewTask = ({ sectionId, disableKeyboardShortcut }: CreateNewTaskProps) => {
    const [text, setText] = useState('')
    const { mutate: createTask } = useCreateTask()
    const inputRef = useRef<HTMLInputElement>(null)

    const submitNewTask = async () => {
        if (!text) return
        else {
            setText('')
            createTask({ title: text, taskSectionId: sectionId })
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
            {/* <Icon source={Images.icons.plus} size={'small'} /> */}
            <FontAwesomeIcon icon={faPlus} color={Colors.icon.gray} />
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
