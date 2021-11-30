import React, { useRef, useState } from 'react'
import { useDrop } from 'react-dnd'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { TASKS_MODIFY_URL } from '../../constants'
import { ItemTypes, TTask, TTaskSection } from '../../helpers/types'
import { taskDropReorder, lookupTaskObject, lookupTaskSection, makeAuthorizedRequest, fetchTasks } from '../../helpers/utils'
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
}

const DropDirection = {
    'Up': true,
    'Down': false,
}

const TaskDropContainer: React.FC<TaskDropContainerProps> = ({ task, dragDisabled }: TaskDropContainerProps) => {
    const { taskSections } = useSelector((state: RootState) => ({
        taskSections: state.tasks_page.task_sections,
    }))
    const dropRef = React.useRef<HTMLDivElement>(null)
    const taskSectionsRef = useRef<TTaskSection[]>()
    const [dropDirection, setDropDirection] = useState(DropDirection.Up)
    taskSectionsRef.current = taskSections

    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.TASK,
        collect: monitor => {
            return { isOver: monitor.isOver() }
        },
        drop: (item: { id: string }, monitor) => {
            setTasksDragState(DragState.noDrag)

            if (taskSectionsRef.current == null) return
            const taskSections = taskSectionsRef.current
            if (item.id === task.id) return
            if (!dropRef.current) return

            const boundingRect = dropRef.current.getBoundingClientRect()
            let isLowerHalf = false
            if (boundingRect != null) {
                const dropMiddleY = (boundingRect.bottom - boundingRect.top) / 2 + boundingRect.top
                const clientOffsetY = monitor.getClientOffset()?.y
                isLowerHalf = !!(clientOffsetY && clientOffsetY > dropMiddleY)
            }

            const updatedTaskSections = taskDropReorder(taskSections, item.id, task.id, isLowerHalf)
            store.dispatch(setTasks(updatedTaskSections))

            const previousOrderingId = lookupTaskObject(taskSections, item.id)?.id_ordering
            const previousSectionId = lookupTaskSection(taskSections, item.id)
            let updatedOrderingId = lookupTaskObject(updatedTaskSections, item.id)?.id_ordering
            const updatedSectionId = lookupTaskSection(updatedTaskSections, item.id)

            if (updatedOrderingId == null || previousOrderingId == null) return
            if (previousSectionId === updatedSectionId && previousOrderingId >= updatedOrderingId) {
                updatedOrderingId -= 1
            }
            makeAuthorizedRequest({
                url: TASKS_MODIFY_URL + item.id + '/',
                method: 'PATCH',
                body: JSON.stringify({
                    id_task_section: taskSections[updatedSectionId].id,
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
                datetimeStart={null}
                dragDisabled={dragDisabled}
                key={task.id}
                isOver={isOver}
                dropDirection={dropDirection}
            />
        </DropOverlay>
    )
}

export default TaskDropContainer
