import './Task.css'

import { connect, useSelector } from 'react-redux'

import { BORDER_PRIMARY } from '../../helpers/styles'
import React from 'react'
import { RootState } from '../../redux/store'
import { TTask } from '../../helpers/types'
import TaskBody from './TaskBody'
import TaskHeader from './TaskHeader'
import styled from 'styled-components'
import { useDrag } from 'react-dnd'
import { ItemTypes } from '../../helpers/types'

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
  isDragDisabled: boolean,
  datetimeStart: string | null, // null if unscheduled_task
}

const Task: React.FC<Props> = ({ task, datetimeStart, isDragDisabled }: Props) => {
  const expanded_body = useSelector((state: RootState) => state.expanded_body)
  const isExpanded = expanded_body === task.id
  const [{opacity}, drag, dragPreview] = useDrag(() => ({
    type: ItemTypes.TASK,
    collect: monitor => ({
      opacity: monitor.isDragging() ? 0.5 : 1
    })
  }))

  return (
    <DraggableContainer style={{opacity}} ref={dragPreview}>
      <Container>
        <TaskHeader
          task={task}
          datetimeStart={datetimeStart}
          isDragDisabled={isDragDisabled}
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
