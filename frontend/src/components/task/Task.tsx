import './Task.css'

import { connect, useSelector } from 'react-redux'

import { BORDER_PRIMARY } from '../../helpers/styles'
import React from 'react'
import { RootState } from '../../redux/store'
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
    margin: 5px 0;
`

interface Props {
  task: TTask,
  taskGroupIndex: number,
  isDragDisabled: boolean,
  datetimeStart: string | null, // null if unscheduled_task
}

const Task: React.FC<Props> = ({ task, datetimeStart, taskGroupIndex, isDragDisabled }: Props) => {
  const expanded_body = useSelector((state: RootState) => state.expanded_body)
  const isExpanded = expanded_body === task.id
  return (
    <DraggableContainer>
      <Container>
        <TaskHeader
          task={task}
          datetimeStart={datetimeStart}
          isDragDisabled={isDragDisabled}
          isExpanded={isExpanded}
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
