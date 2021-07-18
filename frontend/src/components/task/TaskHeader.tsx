import './Task.css'

import { expandBody, removeTaskById, retractBody } from '../../redux/actions'
import { hoverBackground, secondaryText, textDark } from '../../helpers/styles'

import { DraggableProvided } from 'react-beautiful-dnd'
import React from 'react'
import { RootState } from '../../redux/store'
import { TASKS_URL } from '../../constants'
import { makeAuthorizedRequest } from '../../helpers/utils'
import store from '../../redux/store'
import styled from 'styled-components'
import { useSelector } from 'react-redux'

const Header = styled.div<{ hover_effect: boolean }>`
  font-size: 16px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 8px 8px 8px 0;
  cursor: ${props => props.hover_effect ? 'pointer' : 'inherit'};
  &:hover{
    background-color: ${props => props.hover_effect ? hoverBackground : 'inherit'};
  }
`

const HeaderLeft = styled.div`
  text-align: left;
  flex: 1;
  display: flex;
  align-items: center;
  flex-direction: row;
  max-width: 80%;
`

const HeaderRight = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: flex-end;
  max-width: 20%;
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
  color:${secondaryText};
  text-align: right;
`
const SourceWrap = styled(Source)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
const Title = styled.div`
  color:#000000;
`
const TitleWrap = styled(Title)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
const DoneButton = styled.button`
  background-color: white;
  border-radius: 2px;
  border: 2px solid black;
  margin-left: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 6px 4px 6px;
  font-weight: 500;
  cursor: pointer;
  &:hover{
    background-color: black;
    color: white;
  }
`

interface Props {
  logo_url: string,
  title: string,
  sender: string | null,
  task_id: string,
  is_completable: boolean,
  hover_effect: boolean,
  provided: DraggableProvided,
}

const TaskHeader: React.FC<Props> = ({ logo_url, title, sender, task_id, is_completable, hover_effect }: Props) => {
  const expanded_body = useSelector((state: RootState) => state.expanded_body)
  let onClick
  if (hover_effect && expanded_body !== task_id) {
    onClick = () => {
      store.dispatch(expandBody(task_id))
    }
  } else if (hover_effect && expanded_body === task_id) {
    onClick = () => {
      store.dispatch(retractBody())
    }
  }
  else {
    onClick = () => false
  }
  return (
    <Header hover_effect={hover_effect} onClick={onClick}>
      <HeaderLeft>
        <DragSection>
          <Domino src="images/domino.svg" alt="" />
        </DragSection>
        <Icon src={logo_url} alt="icon"></Icon>
        {expanded_body === task_id ? <Title>{title}</Title> : <TitleWrap>{title}</TitleWrap>}
      </HeaderLeft>
      <HeaderRight>
        {expanded_body === task_id ? <Source>{sender}</Source> : <SourceWrap>{sender}</SourceWrap>}
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
      </HeaderRight>
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
