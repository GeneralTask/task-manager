import React from 'react'
import './Task.css'
import {TASKS_URL} from '../../constants'
import store from '../../redux/store'
import {removeTaskById, expandBody, retractBody} from '../../redux/actions'
import {makeAuthorizedRequest} from '../../helpers/utils'
import { useSelector } from 'react-redux'

import styled from 'styled-components'
import { RootState } from '../../redux/store'


const Header = styled.div<{hover_effect: boolean}>`
  font-size: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
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
const Domino = styled.img`
  height: 18px;
`
const Icon = styled.img`
  max-width: 40px;
  padding-left: 12px;
  padding-right: 12px;
`
const Source = styled.div`
  color: #cccccc;
`
const DoneButton = styled.button`
  background-color: white;
  border-radius: 2px;
  border: 2px solid black;
  margin-left: 10px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding: 4px 6px 4px 6px;
  font-weight: 500;
  &:hover{
    background-color: black;
    color: white;
  }
`
// TODO nolan pls help
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UNKNOWN_PROVIDED_TYPE = any

interface Props {
  logo_url: string, 
  title: string, 
  sender: string | null, 
  task_id: string, 
  is_completable: boolean, 
  hover_effect: boolean,
  provided: UNKNOWN_PROVIDED_TYPE,
}

const TaskHeader: React.FC<Props> = ({ logo_url, title, sender, task_id, is_completable, hover_effect }: Props) => {
  const expanded_body = useSelector((state: RootState) => state.expanded_body)
  let onClick
  if (hover_effect && expanded_body !== task_id) {
    onClick = () => {
      store.dispatch(expandBody(task_id))
    }
  } else if(hover_effect && expanded_body === task_id) {
    onClick = () => {
      store.dispatch(retractBody())
    }
  }
  else{
    onClick = ()=>false
  }
  return (
    <Header hover_effect={hover_effect} onClick={onClick}>
      <HeaderSide>
        <Domino src="images/domino.svg" alt="" />
        <Icon src={logo_url} alt="icon"></Icon>
        <div>{title}</div>
      </HeaderSide>
      <Source>{sender}</Source>
      {is_completable ?
      <DoneButton
        onClick={(e) => {
          e.stopPropagation()
          done(task_id)
        }}
      >
        Done
      </DoneButton>
      : null}
    </Header>
  )
}

const done = async (task_id: string) => {
  try {
    store.dispatch(removeTaskById(task_id))
    const response = await makeAuthorizedRequest({
      url: TASKS_URL + task_id,
      method: 'PATCH',
      body: JSON.stringify({ 'is_completed': true })
  })
    
    if (!response.ok) {
      throw new Error('PATCH /tasks api call failed')
    } 
  } catch (e) {
    console.log({e})
  }
}

export default TaskHeader
