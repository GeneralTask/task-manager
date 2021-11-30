import React, { RefObject, useRef, useState } from 'react'
import { useDrop } from 'react-dnd'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { TASKS_MODIFY_URL } from '../../constants'
import { ItemTypes, TTask, TTaskSection, Indices } from '../../helpers/types'
import { taskDropReorder, makeAuthorizedRequest, fetchTasks } from '../../helpers/utils'
import { setTasksDragState, setTasks } from '../../redux/actions'
import { DragState } from '../../redux/enums'
import store, { RootState } from '../../redux/store'
import Task from './Task'

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
    const { taskSections } = useSelector((state: RootState) => ({
        taskSections: state.tasks_page.task_sections,
    }))
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
            setTasksDragState(DragState.noDrag)

            if (item.id === task.id) return
            if (item.indicesRef.current == null) return
            if (taskSectionsRef.current == null) return
            if (dropRef.current == null) return
            if (indicesRef.current == null) return

            const taskSections = taskSectionsRef.current
            const dropIndices = indicesRef.current

            const boundingRect = dropRef.current.getBoundingClientRect()
            let isLowerHalf = false
            if (boundingRect != null) {
                const dropMiddleY = (boundingRect.bottom - boundingRect.top) / 2 + boundingRect.top
                const clientOffsetY = monitor.getClientOffset()?.y
                isLowerHalf = !!(clientOffsetY && clientOffsetY > dropMiddleY)
            }

            const updatedTaskSections = taskDropReorder(taskSections, item.indicesRef.current, dropIndices, isLowerHalf)
            store.dispatch(setTasks(updatedTaskSections))

            const previousOrderingId = taskSections[item.indicesRef.current.section]
                .task_groups[item.indicesRef.current.group]
                .tasks[item.indicesRef.current.task]
                .id_ordering

            const updatedOrderingId = updatedTaskSections[dropIndices.section]
                .task_groups[dropIndices.group]
                .tasks[dropIndices.task]
                .id_ordering

            const updatedSectionId = indices.section

            if (updatedOrderingId == null || previousOrderingId == null) return
            makeAuthorizedRequest({
                url: TASKS_MODIFY_URL + item.id + '/',
                method: 'PATCH',
                body: JSON.stringify({
                    id_task_section: taskSections[updatedSectionId].id,
                    id_ordering: updatedOrderingId,
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
                datetimeStart={null}
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
