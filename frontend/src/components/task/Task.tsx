import './Task.css'

import React, { useState } from 'react'
import { connect, useSelector } from 'react-redux'
import { dragDrop, setTasksDragState } from '../../redux/actions'
import { useDrag, useDrop } from 'react-dnd'

import { BORDER_PRIMARY } from '../../helpers/styles'
import { DragState } from '../../redux/enums'
import { ItemTypes } from '../../helpers/types'
import { RootState } from '../../redux/store'
import { TTask } from '../../helpers/types'
import TaskBody from './TaskBody'
import TaskHeader from './TaskHeader'
import store from '../../redux/store'
import styled from 'styled-components'

const Container = styled.div<{ opacity: number }>`
  padding: 0;
  font-family: 'Ellipsis', 'Gothic A1', sans-serif;
  border: 1px solid ${BORDER_PRIMARY};
  border-radius: 2px;
  width: 100%;
  outline: none;
  background-color: white;
  opacity: ${props => props.opacity}
`
const DraggableContainer = styled.div`
    margin: 5px 0;
    position: relative;
`
const DropIndicator = styled.hr<{ isVisible: boolean }>`
  flex-grow: 1;
  height: 0px;
  position: absolute;
  left: 0px;
  right: 0px;
  color: ${BORDER_PRIMARY};
  border-color: ${BORDER_PRIMARY};
  background-color: ${BORDER_PRIMARY};
  visibility: ${props => props.isVisible ? 'visible' : 'hidden'};
`
const DropIndicatorAbove = styled(DropIndicator)`
  margin-top: -5px;
`
const DropIndicatorBelow = styled(DropIndicator)`
  margin-top: 5.0px;
`
const DropDirection = {
  'Up': true,
  'Down': false,
}

interface Props {
  task: TTask,
  dragDisabled: boolean,
  datetimeStart: string | null, // null if unscheduled_task
}

const Task: React.FC<Props> = (props: Props) => {
  const { task, datetimeStart, dragDisabled } = props
  const dropRef = React.useRef<HTMLDivElement>(null)
  const expanded_body = useSelector((state: RootState) => state.expanded_body)
  const isExpanded = expanded_body === task.id
  const [dropDirection, setDropDirection] = useState(DropDirection.Up)

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
      return { isOver: monitor.isOver()}
    },
    drop: (item: { id: string }, monitor) => {
      setTasksDragState(DragState.noDrag)
      if (item.id === task.id) return
      if (!dropRef.current) return

      const boundingRect = dropRef.current.getBoundingClientRect()
      if (boundingRect != null) {
        const dropMiddleY = (boundingRect.bottom - boundingRect.top) / 2 + boundingRect.top
        const clientOffsetY = monitor.getClientOffset()?.y
        store.dispatch(dragDrop(item.id, task.id, !!(clientOffsetY && clientOffsetY > dropMiddleY)))
      }
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

export default connect((state: RootState) => ({ expanded_body: state.expanded_body }))(
  Task
)
