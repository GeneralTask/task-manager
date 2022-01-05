import './Task.css'

import { TaskContainer, DraggableContainer, DropIndicatorAbove, DropIndicatorBelow } from './Task-style'
import { Indices, ItemTypes } from '../../helpers/types'

import React from 'react'
import { TTask } from '../../helpers/types'
import TaskBody from './TaskBody'
import TaskHeader from './TaskHeader'
import { useAppSelector } from '../../redux/hooks'
import { useDrag } from 'react-dnd'

interface Props {
  task: TTask,
  dragDisabled: boolean,
  isOver: boolean,
  dropDirection: boolean,
  indices: Indices,
}

export default function Task(props: Props): JSX.Element {
  const { task, dragDisabled, isOver, dropDirection } = props
  const { isBodyExpanded } = useAppSelector(state => ({
    isBodyExpanded: state.tasks_page.tasks.expanded_body === task.id,
  }))
  const indicesRef = React.useRef<Indices>()
  indicesRef.current = props.indices

  const [{ opacity }, drag, dragPreview] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id, indicesRef: indicesRef },
    collect: monitor => {
      const isDragging = !!monitor.isDragging()
      return { opacity: isDragging ? 0.5 : 1 }
    }
  }))

  return (
    <DraggableContainer ref={dragPreview}>
      <DropIndicatorAbove isVisible={isOver && dropDirection} />
      <TaskContainer opacity={opacity} isExpanded={isBodyExpanded}>
        <TaskHeader
          task={task}
          dragDisabled={dragDisabled}
          isExpanded={isBodyExpanded}
          ref={drag}
        />
        <TaskBody
          task={task}
          isExpanded={isBodyExpanded}
        />
      </TaskContainer>
      <DropIndicatorBelow isVisible={isOver && !dropDirection} />
    </DraggableContainer>
  )
}
