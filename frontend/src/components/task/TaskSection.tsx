import React, { useCallback, useEffect } from 'react'
import { TTask, TTaskSection } from '../../helpers/types'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'

import TaskCreate from './TaskCreate'
import TaskDropContainer from './TaskDropContainer'
import { flex } from '../../helpers/styles'
import { setSelectionInfo } from '../../redux/tasksPageSlice'
import styled from 'styled-components'
import { useKeyboardShortcut } from '../common/KeyboardShortcut'

const TaskWrapperSides = styled.div`
    width: 22%;
`

interface Props {
    task_section: TTaskSection
    task_section_index: number
}

export default function TaskSection(props: Props): JSX.Element {
    const dispatch = useAppDispatch()
    useEffect(() => {
        dispatch(setSelectionInfo({ id: null }))
    }, [props.task_section.id])
    return (
        <div>
            <KeyboardSelector taskSection={props.task_section} />
            {!props.task_section.is_done && (
                <TaskCreate task_section={props.task_section} task_section_index={props.task_section_index} />
            )}
            {props.task_section.tasks.map((task: TTask, task_index: number) => {
                return (
                    <div key={task_index}>
                        <flex.flex>
                            <TaskWrapperSides />
                        </flex.flex>
                        <TaskDropContainer
                            key={task.id}
                            task={task}
                            dragDisabled={props.task_section.is_done}
                            indices={{
                                section: props.task_section_index,
                                task: task_index,
                            }}
                        />
                    </div>
                )
            })}
        </div>
    )
}

interface KeyboardSelectorProps {
    taskSection: TTaskSection
}
function KeyboardSelector({ taskSection }: KeyboardSelectorProps) {
    const selectedTaskId = useAppSelector((state) => state.tasks_page.tasks.selection_info.id)
    const dispatch = useAppDispatch()
    // on press DOWN -> select first task ahh
    const onUpDown = useCallback(
        (direction: 'up' | 'down') => {
            // if a task is not selected, select the first one
            if (selectedTaskId == null && taskSection.tasks.length > 0) {
                dispatch(setSelectionInfo({ id: taskSection.tasks[0].id, show_keyboard_indicator: true }))
            } else {
                const index = taskSection.tasks.findIndex((task) => task.id === selectedTaskId)
                // if for some reason the task is not found, select the first one
                if (index === -1) {
                    dispatch(setSelectionInfo({ id: taskSection.tasks[0].id, show_keyboard_indicator: true }))
                } else if (direction === 'up' && index > 0) {
                    dispatch(setSelectionInfo({ id: taskSection.tasks[index - 1].id, show_keyboard_indicator: true }))
                } else if (direction === 'down' && index < taskSection.tasks.length - 1) {
                    dispatch(setSelectionInfo({ id: taskSection.tasks[index + 1].id, show_keyboard_indicator: true }))
                }
            }
        },
        [selectedTaskId, taskSection]
    )

    useKeyboardShortcut('ArrowDown', () => onUpDown('down'))
    useKeyboardShortcut('ArrowUp', () => onUpDown('up'))

    return <></>
}
