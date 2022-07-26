import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { useCreateTask } from '../../services/api/tasks.hooks'
import { Border, Colors, Images, Spacing, Typography } from '../../styles'
import { Icon } from '../atoms/Icon'
import KeyboardShortcut from '../atoms/KeyboardShortcut'

const CreateNewTaskContainer = styled.div`
    display: flex;
    flex-shrink: 0;
    flex-direction: row;
    gap: ${Spacing.padding._8};
    background-color: ${Colors.background.medium};
    height: 45px;
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
    ${Typography.body};
`

interface CreateNewTaskProps {
    section: string
}
const CreateNewTask = (props: CreateNewTaskProps) => {
    const [text, setText] = useState('')
    const { mutate: createTask } = useCreateTask()
    const inputRef = useRef<HTMLInputElement>(null)

    const submitNewTask = async () => {
        if (!text) return
        else {
            setText('')
            createTask({
                title: text,
                body: '',
                id_task_section: props.section,
            })
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
            <KeyboardShortcut shortcut="createTask" onKeyPress={() => inputRef.current?.focus()} />
        </CreateNewTaskContainer>
    )
}

export default CreateNewTask
