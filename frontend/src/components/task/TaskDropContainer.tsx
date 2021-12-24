import { Indices, ItemTypes, TTask, TTaskSection } from '../../helpers/types'
import React, { RefObject, useRef, useState } from 'react'
import { makeAuthorizedRequest, taskDropReorder, useFetchTasks } from '../../helpers/utils'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'

import { TASKS_MODIFY_URL } from '../../constants'
import Task from './Task'
import { setTasks } from '../../redux/tasksPageSlice'
import styled from 'styled-components'
import { useDrop } from 'react-dnd'

const DropOverlay = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

interface TaskDropContainerProps {
    task: TTask,
    dragDisabled: boolean,
    indices: Indices,
}

const DropDirection = {
    'Up': true,
    'Down': false,
}

const TaskDropContainer: React.FC<TaskDropContainerProps> = ({ task, dragDisabled, indices }: TaskDropContainerProps) => {
    const fetchTasks = useFetchTasks()
    const { taskSections } = useAppSelector(state => ({
        taskSections: state.tasks_page.tasks.task_sections,
    }))
    const dispatch = useAppDispatch()
    const indicesRef = React.useRef<Indices>()
    const dropRef = React.useRef<HTMLDivElement>(null)
    const taskSectionsRef = useRef<TTaskSection[]>()
    const [dropDirection, setDropDirection] = useState(DropDirection.Up)
    taskSectionsRef.current = taskSections
    indicesRef.current = indices

    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.TASK,
        collect: monitor => {
            return { isOver: monitor.isOver() }
        },
        drop: (item: { id: string, indicesRef: RefObject<Indices> }, monitor) => {
            if (item.id === task.id) return
            if (item.indicesRef.current == null) return
            if (taskSectionsRef.current == null) return
            if (dropRef.current == null) return
            if (indicesRef.current == null) return

            const taskSections = taskSectionsRef.current
            const { section: dropSection } = indicesRef.current
            const { section: dragSection, task: dragTask } = item.indicesRef.current

            const boundingRect = dropRef.current.getBoundingClientRect()
            let isLowerHalf = false
            if (boundingRect != null) {
                const dropMiddleY = (boundingRect.bottom - boundingRect.top) / 2 + boundingRect.top
                const clientOffsetY = monitor.getClientOffset()?.y
                isLowerHalf = !!(clientOffsetY && clientOffsetY > dropMiddleY)
            }

            const previousOrderingId = taskSections[dragSection]
                .tasks[dragTask]
                .id_ordering

            const updatedTaskSections = taskDropReorder(taskSections, item.indicesRef.current, indicesRef.current, isLowerHalf)
            dispatch(setTasks(updatedTaskSections))

            let updatedOrderingId = null
            updatedOrderingId = updatedTaskSections[dropSection]
                .tasks
                .find(task => task.id === item.id)
                ?.id_ordering
            if (updatedOrderingId == null) return
            if (dragSection === dropSection && updatedOrderingId < previousOrderingId) {
                updatedOrderingId -= 1
            }
            if (dragSection !== dropSection) {
                updatedOrderingId -= 1
            }
            makeAuthorizedRequest({
                url: TASKS_MODIFY_URL + item.id + '/',
                method: 'PATCH',
                body: JSON.stringify({
                    id_task_section: taskSections[indices.section].id,
                    id_ordering: updatedOrderingId + 1,
                })
            }).then(fetchTasks).catch((error) => {
                throw new Error('PATCH /tasks/ failed' + error)
            })
        },
        hover: (_, monitor) => {
            if (!dropRef.current) return

            const boundingRect = dropRef.current.getBoundingClientRect()
            if (boundingRect != null) {
                const dropMiddleY = (boundingRect.bottom - boundingRect.top) / 2 + boundingRect.top
                const clientOffsetY = monitor.getClientOffset()?.y
                if (clientOffsetY && (clientOffsetY <= dropMiddleY)) {
                    setDropDirection(DropDirection.Up)
                }
                else {
                    setDropDirection(DropDirection.Down)
                }
            }
        }
    }))
    drop(dropRef)
    return (
        <DropOverlay ref={dropRef}>
            <Task task={task}
                dragDisabled={dragDisabled}
                key={task.id}
                isOver={isOver}
                dropDirection={dropDirection}
                indices={{ ...indices }}
            />
        </DropOverlay>
    )
}

export default TaskDropContainer
