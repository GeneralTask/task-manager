import './Task.css'

import { Draggable, DraggableProvided } from 'react-beautiful-dnd'

import React from 'react'
import { TTask } from '../../helpers/types'
import TaskBody from './TaskBody'
import TaskHeader from './TaskHeader'
import { borderPrimary } from '../../helpers/styles'
import styled from 'styled-components'

const Container = styled.div`
  padding: 0;
  font-family: 'Ellipsis', 'Gothic A1', sans-serif;
  border: 2px solid ${borderPrimary};
  border-radius: 2px;
  width: 100%;
  outline: none;
  background-color: white;
`
const DraggableContainer = styled.div`
    margin-bottom: 5px;
`

interface Props {
  task: TTask,
  taskGroupIndex: number,
  isDragDisabled: boolean,
}

const Task: React.FC<Props> = ({ task, taskGroupIndex, isDragDisabled }: Props) => (
  <Draggable draggableId={task.id} index={taskGroupIndex} isDragDisabled={isDragDisabled}>
    {(provided: DraggableProvided) => (
      <DraggableContainer
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <Container>
          <TaskHeader
            title={task.title}
            logo_url={task.source.logo}
            sender={task.sender}
            task_id={task.id}
            is_completable={task.source.is_completable}
            hover_effect={!!(task.body || task.deeplink)}
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
