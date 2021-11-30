import './Task.css'

import { Container, DraggableContainer, DropIndicatorAbove, DropIndicatorBelow } from './Task-style'

import { DragState } from '../../redux/enums'
import { ItemTypes } from '../../helpers/types'
import React from 'react'
import { TTask } from '../../helpers/types'
import TaskBody from './TaskBody'
import TaskHeader from './TaskHeader'
import { setTasksDragState } from '../../redux/actions'
import { useDrag } from 'react-dnd'

interface Props {
  task: TTask,
  dragDisabled: boolean,
  datetimeStart: string | null, // null if unscheduled_task
  isOver: boolean,
  dropDirection: boolean,
}

export default function Task(props: Props): JSX.Element {
  const { task, datetimeStart, dragDisabled, isOver, dropDirection } = props

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
      <DropIndicatorAbove isVisible={isOver && dropDirection} />
      <Container opacity={opacity} >
        <TaskHeader
          task={task}
          datetimeStart={datetimeStart}
          dragDisabled={dragDisabled}
          ref={drag}
        />
        <TaskBody
          body={task.body}
          task_id={task.id}
          deeplink={task.deeplink}
          source={task.source}
          sender={null} />
      </Container>
      <DropIndicatorBelow isVisible={isOver && !dropDirection} />
    </DraggableContainer>
  )
}
