import { Action, Dispatch } from '@reduxjs/toolkit'
import {
    DoneButton,
    DoneButtonContainer,
    DragHandler,
    HeaderLeft,
    Icon,
    TaskHeaderContainer,
} from './Header-style'
import React, { useCallback } from 'react'
import { DONE_BUTTON, TASKS_MODIFY_URL } from '../../../constants'
import { LogEvents } from '../../../helpers/enums'
import { TTask } from '../../../helpers/types'
import { logEvent, makeAuthorizedRequest } from '../../../helpers/utils'
import { useAppDispatch } from '../../../redux/hooks'
import { removeTaskByID } from '../../../redux/tasksPageSlice'
import Domino from '../../common/Domino'
import { EditableTaskTitle } from '../../common/Title'
import Tooltip from '../../common/Tooltip'
import { useFetchTasks } from '../TasksPage'
import HeaderActions from './Actions'

const done = async (task_id: string, dispatch: Dispatch<Action<string>>, fetchTasks: () => void) => {
    try {
        dispatch(removeTaskByID(task_id))
        const response = await makeAuthorizedRequest({
            url: TASKS_MODIFY_URL + task_id + '/',
            method: 'PATCH',
            body: JSON.stringify({ is_completed: true }),
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
}

const TaskHeader = React.forwardRef<HTMLDivElement, TaskHeaderProps>((props: TaskHeaderProps, ref) => {
    const [isHovering, setIsHovering] = React.useState(false)
    const dispatch = useAppDispatch()
    const fetchTasks = useFetchTasks()

    const onDoneButtonClick = useCallback(() => {
        done(props.task.id, dispatch, fetchTasks)
        logEvent(LogEvents.TASK_MARK_AS_DONE)
    }, [])

    return (
        <TaskHeaderContainer showButtons={props.isExpanded} onMouseOver={() => { setIsHovering(true) }} onMouseLeave={() => { setIsHovering(false) }}>
            <HeaderLeft>
                {
                    !props.dragDisabled &&
                    <DragHandler ref={ref} onClick={(e) => e.stopPropagation()}>
                        <Domino />
                    </DragHandler>
                }
                {
                    props.task.source.is_completable &&
                    <DoneButtonContainer>
                        <Tooltip text="Mark as done">
                            <DoneButton src={DONE_BUTTON} onClick={(e) => {
                                e.stopPropagation()
                                onDoneButtonClick()
                            }} />
                        </Tooltip>
                    </DoneButtonContainer>
                }
                <Icon src={props.task.source.logo} alt="icon"></Icon>
                <EditableTaskTitle task={props.task} isExpanded={props.isExpanded} />
            </HeaderLeft >
            <HeaderActions isHovering={isHovering} isExpanded={props.isExpanded} taskId={props.task.id} task={props.task} timeAllocated={props.task.time_allocated} dueDate={props.task.due_date} />
        </TaskHeaderContainer >
    )
})

export default TaskHeader
export type { TaskHeaderProps }
