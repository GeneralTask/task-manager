import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import { useAppDispatch } from '../../redux/hooks'
import { setSelectedItemId } from '../../redux/tasksPageSlice'
import { useCreateTask } from '../../services/api-query-hooks'
import { Colors, Images, Typography } from '../../styles'
import { radius } from '../../styles/border'
import { padding } from '../../styles/spacing'
import { Icon, KeyboardShortcut } from '@atoms'

const CreateNewTaskContainer = styled.div`
    display: flex;
    flex-shrink: 0;
    flex-direction: row;
    gap: ${padding._8}px;
    background-color: ${Colors.gray._100};
    height: 45px;
    align-items: center;
    padding: 0px ${padding._8}px;
    border-radius: ${radius.large};
    margin-bottom: ${padding._8}px;
`
const TaskInput = styled.input`
    border: none;
    outline: none;
    background-color: transparent;
    font-size: ${Typography.medium.fontSize};
    font-family: Switzer-Variable;
    flex: 1;
`

interface CreateNewTaskProps {
    section: string
}
const CreateNewTask = (props: CreateNewTaskProps) => {
    const [text, setText] = useState('')
    const { mutate: createTask } = useCreateTask()
    const dispatch = useAppDispatch()
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
                onFocus={() => dispatch(setSelectedItemId(null))}
                onChange={(e) => setText(e.target.value)}
            />
            <KeyboardShortcut shortcut={KEYBOARD_SHORTCUTS.CREATE_TASK} onKeyPress={() => inputRef.current?.focus()} />
        </CreateNewTaskContainer>
    )
}

export default CreateNewTask
