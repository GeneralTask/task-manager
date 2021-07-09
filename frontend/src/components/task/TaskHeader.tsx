import './Task.css'

import { expandBody, removeTaskById, retractBody } from '../../redux/actions'

import { DraggableProvided } from 'react-beautiful-dnd'
import React from 'react'
import { RootState } from '../../redux/store'
import { TASKS_URL } from '../../constants'
import { makeAuthorizedRequest } from '../../helpers/utils'
import store from '../../redux/store'
import styled from 'styled-components'
import { useSelector } from 'react-redux'

const Header = styled.div<{ hover_effect: boolean }>`
  font-size: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 8px 8px 8px 0;
  cursor: ${props => props.hover_effect ? 'pointer' : 'inherit'};
  &:hover{
    background-color: ${props => props.hover_effect ? '#e3e3e3' : 'inherit'};
  }
`

const HeaderSide = styled.div`
  text-align: left;
  flex: 1;
  display: flex;
  align-items: center;
  flex-direction: row;
`
const DragSection = styled.div`
  cursor: grab;
  display: flex;
  align-items: center;
  padding: 0 12px 0 8px;
`
const Domino = styled.img`
  height: 18px;
`
const Icon = styled.img`
  max-width: 40px;
  padding-right: 12px;
`
const Source = styled.div`
  color: #cccccc;
  max-width: 25%;
  text-align: right;
`
const DoneButton = styled.button`
  background-color: black;
  color: white;
  border-radius: 4px;
  border: 2px solid black;
  margin-left: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 6px 4px 6px;
  font-weight: 500;
  cursor: pointer;
`

interface Props {
  logo_url: string,
  title: string,
  sender: string | null,
  task_id: string,
  is_completable: boolean,
  hover_effect: boolean,
  provided: DraggableProvided,
  isFocused: boolean,
}

const TaskHeader: React.FC<Props> = (props: Props) => {
  const expanded_body = useSelector((state: RootState) => state.expanded_body)
  let onClick
  if (props.hover_effect && expanded_body !== props.task_id) {
    onClick = () => {
      store.dispatch(expandBody(props.task_id))
    }
  } else if (props.hover_effect && expanded_body === props.task_id) {
    onClick = () => {
      store.dispatch(retractBody())
    }
  }
  else {
    onClick = () => false
  }
  return (
    <Header hover_effect={props.hover_effect} onClick={onClick}>
      <HeaderSide>
        <DragSection>
          <Domino src="images/domino.svg" alt="" />
        </DragSection>
        <Icon src={props.logo_url} alt="icon"></Icon>
        <div>{props.title}</div>
      </HeaderSide>
      <Source>{props.sender}</Source>
      {props.isFocused && props.is_completable &&
        <DoneButton
          onClick={(e) => {
            e.stopPropagation()
            done(props.task_id)
          }}
        >
          Done
        </DoneButton>
      }
    </Header>
  )
}

const done = async (task_id: string) => {
  try {
    store.dispatch(removeTaskById(task_id))
    const response = await makeAuthorizedRequest({
      url: TASKS_URL + task_id + '/',
      method: 'PATCH',
      body: JSON.stringify({ 'is_completed': true })
    })

    if (!response.ok) {
      throw new Error('PATCH /tasks api call failed')
    }
  } catch (e) {
    console.log({ e })
  }
}

export default TaskHeader
