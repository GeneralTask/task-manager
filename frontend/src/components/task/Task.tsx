import React from 'react'
import './Task.css'
import TaskHeader from './TaskHeader'
import { Draggable, DraggableProvided } from 'react-beautiful-dnd'
import styled from 'styled-components'
import TaskBody from './TaskBody'
import { TTask } from '../../helpers/types'
import { connect, useSelector } from 'react-redux'
import store, { RootState } from '../../redux/store'
import { setFocus } from '../../redux/actions'

const Container = styled.div<{ isFocused: boolean }>`
  padding: 0;
  font-family: "Gothic A1", sans-serif;
  border: ${props => !props.isFocused ? '2px solid #cccccc' : '2px solid black'};
  border-radius: 2px;
  margin: 5px 0;
  outline: none;
  background-color: white;
`

interface Props {
  task: TTask,
  index: number,
  isDragDisabled: boolean,
}

const Task: React.FC<Props> = ({ task, index }: Props) => {

  const focused_task = useSelector((state: RootState) => state.focused_task)
  const isFocused = focused_task === task.id
  if (isFocused) console.log('task ' + focused_task + ' is focused')

  return <Draggable draggableId={task.id} index={index}>
    {(provided: DraggableProvided) => (
      <Container
        isFocused={isFocused}
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        onMouseEnter={() => { store.dispatch(setFocus(task.id)) }}>
        <TaskHeader
          title={task.title}
          logo_url={task.source.logo}
          sender={task.sender}
          task_id={task.id}
          is_completable={task.source.is_completable}
          hover_effect={!!(task.body || task.deeplink)}
          provided={provided}
          isFocused={isFocused}
        />
        <TaskBody body={task.body} task_id={task.id} deeplink={task.deeplink} source={task.source} />
      </Container>
    )}
  </Draggable>
}

export default connect((state: RootState) => ({ focused_task: state.focused_task }))(
  Task
)
