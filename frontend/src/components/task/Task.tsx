import './Task.css'

import { Container, DraggableContainer, DropIndicatorAbove, DropIndicatorBelow } from './Task-style'
import { ItemTypes, TTaskSection } from '../../helpers/types'
import React, { useRef } from 'react'
import { setTasksDragState } from '../../redux/actions'
import { useDrag } from 'react-dnd'

import { DragState } from '../../redux/enums'
import { RootState } from '../../redux/store'
import { TTask } from '../../helpers/types'
import TaskBody from './TaskBody'
import TaskHeader from './TaskHeader'
import { useSelector } from 'react-redux'

interface Props {
  task: TTask,
  dragDisabled: boolean,
  datetimeStart: string | null, // null if unscheduled_task
  indices: {
    task: number,
    group: number,
    section: number,
  }
}

export default function Task(props: Props): JSX.Element {
  const { task, datetimeStart, dragDisabled } = props
  const { isBodyExpanded, taskSections } = useSelector((state: RootState) => ({
    isBodyExpanded: state.tasks_page.expanded_body === task.id,
    taskSections: state.tasks_page.task_sections,
  }))
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

  return (
    <DraggableContainer ref={dragPreview}>
      <DropIndicatorAbove isVisible={false} />
      <Container opacity={opacity} >
        <TaskHeader
          task={task}
          datetimeStart={datetimeStart}
          dragDisabled={dragDisabled}
          isExpanded={isBodyExpanded}
          ref={drag}
        />
        <TaskBody
          body={task.body}
          task_id={task.id}
          deeplink={task.deeplink}
          source={task.source}
          isExpanded={isBodyExpanded} sender={null} />
      </Container>
      <DropIndicatorBelow isVisible={false} />
    </DraggableContainer>
  )
}
