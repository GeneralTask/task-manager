import React, { forwardRef, useEffect, useState } from 'react'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import KEYBOARD_SHORTCUTS from '../../constants/shortcuts'
import { useCreateTask } from '../../services/api/tasks.hooks'
import { Typography } from '../../styles'
import { stopKeydownPropogation } from '../../utils/utils'
import { TaskInput } from './CreateNewTask'
import { SubtaskContainer } from './Subtask'

const blurShortcuts = [KEYBOARD_SHORTCUTS.close.key]

const CreateNewTaskContainer = styled(SubtaskContainer)`
    cursor: text;
    :hover {
        background-color: transparent;
    }
`

const SubtaskInput = styled(TaskInput)`
    all: unset;
    background-color: transparent;
    flex: 1;
    typography: ${Typography.body};
    width: 100%;
`

interface CreateNewSubtaskProps {
    parentTaskId: string
    sectionId: string
    onBlur?: () => void
}

const CreateNewSubtask = forwardRef(
    ({ parentTaskId, sectionId, onBlur }: CreateNewSubtaskProps, ref: React.ForwardedRef<HTMLInputElement>) => {
        const { mutate: createTask } = useCreateTask()
        const [taskTitle, setTaskTitle] = useState('')
        const inputRef = React.useRef<HTMLInputElement | null>(null)

        useEffect(() => {
            inputRef.current?.focus()
        }, [])

        const handleKeyDown = (e: React.KeyboardEvent) => {
            stopKeydownPropogation(e)
            if (blurShortcuts.includes(e.key)) {
                inputRef.current?.blur()
                if (onBlur) {
                    onBlur()
                }
            }
            if (e.key === 'Enter') {
                createTask({
                    title: taskTitle,
                    parent_task_id: parentTaskId,
                    taskSectionId: sectionId,
                    optimisticId: uuidv4(),
                })
                if (onBlur) {
                    onBlur()
                }
            }
        }

        return (
            <CreateNewTaskContainer>
                <SubtaskInput
                    ref={(node) => {
                        inputRef.current = node
                        if (typeof ref === 'function') {
                            ref(node)
                        } else if (ref !== null) {
                            ref.current = node
                        }
                    }}
                    value={taskTitle}
                    placeholder="Write new subtask title"
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setTaskTitle(e.target.value)}
                />
            </CreateNewTaskContainer>
        )
    }
)

export default CreateNewSubtask
