import './Task.css'

import { Container, DraggableContainer, DropIndicatorAbove, DropIndicatorBelow } from './Task-style'
import { ItemTypes, TTaskSection } from '../../helpers/types'
import React, { useRef, useState } from 'react'
import { taskDropReorder, fetchTasks, lookupTaskObject, lookupTaskSection, makeAuthorizedRequest } from '../../helpers/utils'
import { setTasks, setTasksDragState } from '../../redux/actions'
import { useDrag, useDrop } from 'react-dnd'

import { DragState } from '../../redux/enums'
import { RootState } from '../../redux/store'
import { TASKS_MODIFY_URL } from '../../constants'
import { TTask } from '../../helpers/types'
import TaskBody from './TaskBody'
import TaskHeader from './TaskHeader'
import store from '../../redux/store'
import { useSelector } from 'react-redux'

const DropDirection = {
  'Up': true,
  'Down': false,
}

interface Props {
  task: TTask,
  dragDisabled: boolean,
  datetimeStart: string | null, // null if unscheduled_task
}

export default function Task(props: Props): JSX.Element {
  const { task, datetimeStart, dragDisabled } = props
  const dropRef = React.useRef<HTMLDivElement>(null)
  const { expandedBody, taskSections } = useSelector((state: RootState) => ({
    expandedBody: state.tasks_page.expanded_body,
    taskSections: state.tasks_page.task_sections,
  }))
  const isExpanded = expandedBody === task.id
  const [dropDirection, setDropDirection] = useState(DropDirection.Up)
  const taskSectionsRef = useRef<TTaskSection[]>()

  taskSectionsRef.current = taskSections


  const [{ opacity }, drag, dragPreview] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id },
    collect: monitor => {
      const isDragging = !!monitor.isDragging()
      if (isDragging) setTasksDragState(DragState.isDragging)
      return { opacity: isDragging ? 0.5 : 1 }
    }
  }))
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
    <div ref={dropRef}>
      <DraggableContainer ref={dragPreview}>
        <DropIndicatorAbove isVisible={isOver && dropDirection} />
        <Container opacity={opacity} >
          <TaskHeader
            task={task}
            datetimeStart={datetimeStart}
            dragDisabled={dragDisabled}
            isExpanded={isExpanded}
            ref={drag}
          />
          <TaskBody
            body={task.body}
            task_id={task.id}
            deeplink={task.deeplink}
            source={task.source}
            isExpanded={isExpanded} sender={null} />
        </Container>
        <DropIndicatorBelow isVisible={isOver && !dropDirection} />
      </DraggableContainer>
    </div>
  )
}
