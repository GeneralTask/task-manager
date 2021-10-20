import './Task.css'

import { Draggable, DraggableProvided } from 'react-beautiful-dnd'

import { BORDER_PRIMARY } from '../../helpers/styles'
import React from 'react'
import { TTask } from '../../helpers/types'
import TaskBody from './TaskBody'
import TaskHeader from './TaskHeader'
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
    margin: 2.5px 0;
`

interface Props {
  task: TTask,
  taskGroupIndex: number,
  isDragDisabled: boolean,
  datetimeStart: string | null, // null if unscheduled_task
}

const Task: React.FC<Props> = ({ task, datetimeStart, taskGroupIndex, isDragDisabled }: Props) => (
  <Draggable draggableId={task.id} index={taskGroupIndex} isDragDisabled={isDragDisabled}>
    {(provided: DraggableProvided) => (
      <DraggableContainer
        ref={provided.innerRef}
        {...provided.draggableProps}
      >
        <Container>
          <TaskHeader
            task={task}
            datetimeStart={datetimeStart}
            provided={provided}
            isDragDisabled={isDragDisabled}
          />
          <TaskBody body={task.body} task_id={task.id} deeplink={task.deeplink} source={task.source} />
        </Container>
      </DraggableContainer>
    )}
  </Draggable>
)

export default Task
