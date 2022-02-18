import { Action, Dispatch } from '@reduxjs/toolkit'
import { DONE_BUTTON, TASKS_MODIFY_URL, UNDONE_BUTTON } from '../../../constants'
import { DoneButton, DoneButtonContainer, DragHandler, HeaderLeft, Icon, TaskHeaderContainer } from './Header-style'
import React, { useCallback } from 'react'
import {
    hideDatePicker,
    hideLabelSelector,
    hideTimeEstimate,
    removeTaskByID,
    setSelectionInfo,
} from '../../../redux/tasksPageSlice'
import { logEvent, makeAuthorizedRequest } from '../../../helpers/utils'

import Domino from '../../common/Domino'
import { EditableTaskTitle } from '../../common/Title'
import HeaderActions from './Actions'
import { InvisibleKeyboardShortcut } from '../../common/KeyboardShortcut'
import { LogEvents } from '../../../helpers/enums'
import { TTask } from '../../../helpers/types'
import Tooltip from '../../common/Tooltip'
import { useAppDispatch } from '../../../redux/hooks'
import { useFetchTasks } from '../TasksPage'

const done = async (
    task_id: string,
    new_state: boolean,
    dispatch: Dispatch<Action<string>>,
    fetchTasks: () => void
) => {
    try {
        dispatch(removeTaskByID(task_id))
        const response = await makeAuthorizedRequest({
            url: TASKS_MODIFY_URL + task_id + '/',
            method: 'PATCH',
            body: JSON.stringify({ is_completed: new_state }),
        })

        if (!response.ok) {
            throw new Error('PATCH /tasks/modify Mark as Done failed: ' + response.text())
        }
        fetchTasks()
    } catch (e) {
        console.log({ e })
    }
}

interface TaskHeaderProps {
    task: TTask
    dragDisabled: boolean
    isExpanded: boolean
    isSelected: boolean
}

const TaskHeader = React.forwardRef<HTMLDivElement, TaskHeaderProps>((props: TaskHeaderProps, ref) => {
    const [isOver, setIsOver] = React.useState(false)
    const dispatch = useAppDispatch()
    const fetchTasks = useFetchTasks()

    const onDoneButtonClick = useCallback(() => {
        done(props.task.id, !props.task.is_done, dispatch, fetchTasks)
        logEvent(LogEvents.TASK_MARK_AS_DONE)
    }, [])
    const onMouseLeave = () => {
        setIsOver(false)
        dispatch(hideLabelSelector())
        dispatch(hideDatePicker())
        dispatch(hideTimeEstimate())
    }
    const onClick = () => {
        dispatch(setSelectionInfo({ id: props.task.id, is_body_expanded: !props.isExpanded }))
    }

    return (
        <TaskHeaderContainer
            showButtons={props.isExpanded}
            onMouseOver={() => {
                setIsOver(true)
            }}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
        >
            {props.isSelected && <InvisibleKeyboardShortcut shortcut="d" onKeyPress={onDoneButtonClick} />}
            <HeaderLeft>
                {!props.dragDisabled && (
                    <DragHandler ref={ref} onClick={(e) => e.stopPropagation()}>
                        <Domino />
                    </DragHandler>
                )}
                {props.task.source.is_completable && (
                    <DoneButtonContainer>
                        <Tooltip text={props.task.is_done ? 'Mark as undone' : 'Mark as done'}>
                            <DoneButton
                                src={props.task.is_done ? UNDONE_BUTTON : DONE_BUTTON}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDoneButtonClick()
                                }}
                            />
                        </Tooltip>
                    </DoneButtonContainer>
                )}
                <Icon src={props.task.source.logo} alt="icon"></Icon>
                <EditableTaskTitle task={props.task} isExpanded={props.isExpanded} />
            </HeaderLeft>
            <HeaderActions
                isOver={isOver}
                task={props.task}
                isExpanded={props.isExpanded}
                isSelected={props.isSelected}
            />
        </TaskHeaderContainer>
    )
})

export default TaskHeader
export type { TaskHeaderProps }
