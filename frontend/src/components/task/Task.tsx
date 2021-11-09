import './Task.css'

import { connect, useSelector } from 'react-redux'
import { dragDrop, setTasksDragState } from '../../redux/actions'
import { useDrag, useDrop } from 'react-dnd'

import { BORDER_PRIMARY } from '../../helpers/styles'
import { DragState } from '../../redux/enums'
import { ItemTypes } from '../../helpers/types'
import React, { useState } from 'react'
import { RootState } from '../../redux/store'
import { TTask } from '../../helpers/types'
import TaskBody from './TaskBody'
import TaskHeader from './TaskHeader'
import store from '../../redux/store'
import styled from 'styled-components'

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
    position: relative;
`
const DropIndicator = styled.hr<{isVisible:boolean}>`
  flex-grow: 1;
  height: 0px;
  position: absolute;
  left: 0px;
  right: 0px;
  color: ${BORDER_PRIMARY};
  border-color: ${BORDER_PRIMARY};
  background-color: ${BORDER_PRIMARY};
  opacity: ${props => props.isVisible ? '1.0' : '0.0'};
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
  dragDropDisabled: boolean,
  datetimeStart: string | null, // null if unscheduled_task
}

const Task: React.FC<Props> = (props: Props) => {
  const { task, datetimeStart, dragDropDisabled } = props
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
  const [{isOverDroppable}, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    collect: monitor => {
      return {isOverDroppable: monitor.isOver() && !props.dragDropDisabled}
    },
    drop: (item: { id: string }, monitor) => {
      if (item.id === task.id || dragDropDisabled) return
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
      <DraggableContainer style={{opacity}} ref={dragPreview}>
        <DropIndicatorAbove isVisible={isOverDroppable && dropDirection}></DropIndicatorAbove>
        <Container >
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
              isExpanded={isExpanded} sender={null}/>
        </Container>
        <DropIndicatorBelow isVisible={isOverDroppable && !dropDirection}></DropIndicatorBelow>
      </DraggableContainer>
    </div>
  )
}

export default connect((state: RootState) => ({ expanded_body: state.expanded_body }))(
  Task
)
