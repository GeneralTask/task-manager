import './Task.css'

import { Container, DraggableContainer, DropIndicatorAbove, DropIndicatorBelow } from './Task-style'
import { Indices, ItemTypes } from '../../helpers/types'
import React from 'react'
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
  isOver: boolean,
  dropDirection: boolean,
  indices: Indices,
}

export default function Task(props: Props): JSX.Element {
  const { task, datetimeStart, dragDisabled, isOver, dropDirection } = props
  const { isBodyExpanded } = useSelector((state: RootState) => ({
    isBodyExpanded: state.tasks_page.expanded_body === task.id,
  }))
  const indicesRef = React.useRef<Indices>()
  indicesRef.current = props.indices

  const [{ opacity }, drag, dragPreview] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id, indicesRef: indicesRef },
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
          isExpanded={isBodyExpanded}
          ref={drag}
        />
        <TaskBody
          body={task.body}
          task_id={task.id}
          deeplink={task.deeplink}
          source={task.source}
          isExpanded={isBodyExpanded}
          sender={task.sender} />
      </Container>
      <DropIndicatorBelow isVisible={isOver && !dropDirection} />
    </DraggableContainer>
  )
}
