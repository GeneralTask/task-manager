import React from 'react'
import './Task.css'
import TaskHeader from './TaskHeader'
import { Draggable } from 'react-beautiful-dnd'
import styled from 'styled-components'
import TaskBody from './TaskBody'
import {TTask} from '../../helpers/types'

const Container = styled.div`
  padding: 0;
  font-family: "Gothic A1", sans-serif;
  border: 2px solid #cccccc;
  border-radius: 2px;
  margin: 5px 0;
  width: 100%;
  outline: none;
  background-color: white;
`

interface Props {
  task: TTask, 
  index: number, 
  isDragDisabled: boolean,
}

// nolan pls help
type UNKNOWN_PROVIDED_TYPE = any

const Task: React.FC<Props> = ({ task, index, isDragDisabled }: Props) => (
  <Draggable draggableId={task.id} index={index}>
    {(provided: UNKNOWN_PROVIDED_TYPE) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <Container>
          <TaskHeader
            title={task.title}
            logo_url={task.logo_url}
            sender={task.sender}
            task_id={task.id}
            is_completable={task.is_completable}
            hover_effect={!!(task.body || task.deeplink)}
            provided={provided}
          />
          <TaskBody body={task.body} task_id={task.id} deeplink={task.deeplink} source={task.source}/>
        </Container>
      </div>
    )}
  </Draggable>
)

export default Task
