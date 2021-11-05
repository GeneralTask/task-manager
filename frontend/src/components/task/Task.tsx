import './Task.css'

import { connect, useSelector } from 'react-redux'

import { BORDER_PRIMARY } from '../../helpers/styles'
import React from 'react'
import { RootState } from '../../redux/store'
import { DropResult, TTask } from '../../helpers/types'
import TaskBody from './TaskBody'
import TaskHeader from './TaskHeader'
import styled from 'styled-components'
import { useDrag, useDrop } from 'react-dnd'
import { ItemTypes } from '../../helpers/types'
import store from '../../redux/store'
import { dragDrop, setTasksDragState } from '../../redux/actions'
import { DragState } from '../../redux/enums'

const Container = styled.div`
  padding: 0;
  font-family: 'Ellipsis', 'Gothic A1', sans-serif;
  border: 1px solid ${BORDER_PRIMARY};
  border-radius: 2px;
  width: 100%;
  outline: none;
  background-color: white;
`
const DraggableContainer = styled.div`
    margin: 5px 0;
`

interface Props {
  task: TTask,
  dragDropDisabled: boolean,
  datetimeStart: string | null, // null if unscheduled_task
}

const Task: React.FC<Props> = (props: Props) => {
  const { task, datetimeStart, dragDropDisabled } = props
  const previewDropRef = React.useRef<HTMLDivElement>(null)
  const expanded_body = useSelector((state: RootState) => state.expanded_body)
  const isExpanded = expanded_body === task.id

  const [{opacity}, drag, dragPreview] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id },
    end: (item, monitor) => {
      const dropResult: DropResult | null = monitor.getDropResult()
      if (dropResult === null || item.id === dropResult.id) return
      if (dropResult.dropDisabled) return
      store.dispatch(dragDrop(item, dropResult))
    },
    collect: monitor => {
      const isDragging = !!monitor.isDragging()
      if (isDragging) setTasksDragState(DragState.isDragging)
      return { opacity: isDragging ? 0.5 : 1 }
    }
  }))
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: () => ({
      id: task.id,
      dropDisabled: dragDropDisabled
    }),
  }))
  dragPreview(drop(previewDropRef))

  return (
    <DraggableContainer style={{opacity}} ref={previewDropRef}>
      <Container>
        <TaskHeader
          task={task}
          datetimeStart={datetimeStart}
          dragDropDisabled={dragDropDisabled}
          isExpanded={isExpanded}
          ref={drag}
        />
        <TaskBody
          body={task.body}
          task_id={task.id}
          deeplink={task.deeplink}
          source={task.source}
          isExpanded={isExpanded}
        />
      </Container>
    </DraggableContainer>
  )
}

export default connect((state: RootState) => ({ expanded_body: state.expanded_body }))(
  Task
)
