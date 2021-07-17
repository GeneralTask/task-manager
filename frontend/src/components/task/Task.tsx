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
  font-family: "Gothic A1", sans-serif;
  border: 2px solid ${borderPrimary};
  border-radius: 2px;
  margin-bottom: 5px;
  width: 100%;
  outline: none;
  background-color: white;
`

interface Props {
  task: TTask,
  index: number,
  isDragDisabled: boolean,
}

const Task: React.FC<Props> = ({ task, index }: Props) => (
  <Draggable draggableId={task.id} index={index}>
    {(provided: DraggableProvided) => (
      <div
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
          />
          <TaskBody body={task.body} task_id={task.id} deeplink={task.deeplink} source={task.source} />
        </Container>
      </div>
    )}
  </Draggable>
)

export default Task
