import React, { useCallback, useEffect } from 'react'
import { TTask, TTaskSection } from '../../helpers/types'
import { hideDatePicker, hideLabelSelector, hideTimeEstimate, setSelectionInfo } from '../../redux/tasksPageSlice'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'

import TaskCreate from './TaskCreate'
import TaskDropContainer from './TaskDropContainer'
import { flex } from '../../helpers/styles'
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
        dispatch(setSelectionInfo({ id: null, show_keyboard_indicator: false, is_body_expanded: false }))
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
            let newSelectedTask = ''
            // if a task is not selected, select the first one
            if (selectedTaskId == null && taskSection.tasks.length > 0) {
                newSelectedTask = taskSection.tasks[0].id
            } else {
                const index = taskSection.tasks.findIndex((task) => task.id === selectedTaskId)
                // if for some reason the task is not found, select the first one
                if (index === -1) {
                    newSelectedTask = taskSection.tasks[0].id
                } else if (direction === 'up' && index > 0) {
                    newSelectedTask = taskSection.tasks[index - 1].id
                } else if (direction === 'down' && index < taskSection.tasks.length - 1) {
                    newSelectedTask = taskSection.tasks[index + 1].id
                }
            }
            if (newSelectedTask) {
                dispatch(
                    setSelectionInfo({
                        id: newSelectedTask,
                        show_keyboard_indicator: true,
                        is_body_expanded: false,
                    })
                )
                dispatch(hideTimeEstimate())
                dispatch(hideLabelSelector())
                dispatch(hideDatePicker())
            }
        },
        [selectedTaskId, taskSection]
    )

    useKeyboardShortcut('ArrowDown', () => onUpDown('down'))
    useKeyboardShortcut('ArrowUp', () => onUpDown('up'))

    return <></>
}
