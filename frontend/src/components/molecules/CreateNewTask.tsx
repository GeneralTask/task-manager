import { Colors, Images, Typography } from '../../styles'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import { useCreateTask } from '../../services/api-query-hooks'
import KeyboardShortcut from '../atoms/KeyboardShortcut'
import styled from 'styled-components'
import { padding } from '../../styles/spacing'
import { radius } from '../../styles/border'
import { Icon } from '../atoms/Icon'

const CreateNewTaskContainer = styled.div`
    display: flex;
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
    const [isFocused, setIsFocused] = useState(false)
    const handleBlur = useCallback(() => setIsFocused(false), [])
    const { mutate: createTask } = useCreateTask()
    const inputRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (!inputRef.current) return
        if (isFocused) {
            inputRef.current.focus()
        } else {
            inputRef.current.blur()
        }
    }, [isFocused])

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
        e.stopPropagation()
        if (e.key === 'Enter') submitNewTask()
        else if (e.key === 'Escape') handleBlur()
    }
    return (
        <CreateNewTaskContainer>
            <Icon source={Images.icons.plus} size={'small'} />
            <TaskInput onBlur={handleBlur}
                ref={inputRef}
                value={text}
                placeholder="Add new task"
                onKeyDown={handleKeyDown}
                onChange={(e) => setText(e.target.value)} />
            <KeyboardShortcut
                shortcut={KEYBOARD_SHORTCUTS.CREATE_TASK}
                onKeyPress={() => setIsFocused(true)} />
        </CreateNewTaskContainer>
    )
}

export default CreateNewTask
