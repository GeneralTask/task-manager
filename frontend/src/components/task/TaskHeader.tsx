import './Task.css'

import { BACKGROUND_HOVER, NoSelect, TEXT_BLACK, TEXT_GRAY, device, flex } from '../../helpers/styles'
import { expandBody, removeTaskById, retractBody } from '../../redux/actions'
import { fetchTasks, makeAuthorizedRequest } from '../../helpers/utils'

import GTButton from '../common/GTButton'
import JoinConferenceButton from './JoinConferenceButton'
import React from 'react'
import { RootState } from '../../redux/store'
import { TASKS_MODIFY_URL } from '../../constants'
import { TTask } from '../../helpers/types'
import store from '../../redux/store'
import styled from 'styled-components'
import { useCountdown } from './TaskWrappers'
import { useSelector } from 'react-redux'

const HeaderLeft = styled.div`
  text-align: left; 
  flex: 1;
  display: flex;
  align-items: center;
  flex-direction: row;
  min-width: 0;
  flex-basis: auto;
`
const HeaderRight = styled.div`
  display: flex;
  flex: content;
  align-items: center;
  flex-direction: row;
  justify-content: flex-end;
  color:${TEXT_GRAY};
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
const Spacer = styled(DragSection)`
  cursor: pointer;
  visibility: hidden;
  padding: 0;
`
const Icon = styled.img`
  max-width: 25px;
  padding-right: 12px;
`
const Title = styled.div`
  color:${TEXT_BLACK};
`
const TitleWrap = styled(Title)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
const Truncated = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
// wrapper for Done Button so that it can be hidden by Header
const HoverButton = styled.div`
  margin-left: 10px;
`
const Black = styled.span`
  color: ${TEXT_BLACK};
`
const Space = styled.span`
  width: 0.5ch;
`
const Header = styled(NoSelect) <{ hoverEffect: boolean, showButtons: boolean }>`
  font-size: 16px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  min-height: 30px;
  padding: 8px 8px 8px 0;
  cursor: ${props => props.hoverEffect ? 'pointer' : 'inherit'};
  &:hover{
    background-color: ${props => props.hoverEffect ? BACKGROUND_HOVER : 'inherit'};
  }
  &:hover > div > ${HoverButton} {
    display: inherit;
  }
  @media ${device.mobile} {
    & > div > ${HoverButton} {
      display: ${props => props.showButtons ? 'inherit' : 'none'};;
    }
  }
  &:hover > div > ${Truncated} {
    display: none;
  }
  & > div > ${Truncated} {
    display: inherit;
  }
`

interface Props {
  task: TTask,
  datetimeStart: string | null, // null if unscheduled_task
  dragDisabled: boolean,
  isExpanded: boolean,
}

const TaskHeader = React.forwardRef<HTMLDivElement, Props>((props: Props, ref) => {
  const expanded_body = useSelector((state: RootState) => state.tasks_page.expanded_body)
  const countdown = useCountdown(props.datetimeStart)

  const hoverEffectEnabled = !!(props.task.body || props.task.deeplink)

  const onClick: () => void = hoverEffectEnabled
    ? hoverEffectEnabled && expanded_body !== props.task.id
      ? () => { store.dispatch(expandBody(props.task.id)) }
      : () => { store.dispatch(retractBody()) }
    : () => void 0 // do nothing if hoverEffectEnabled == false

  return (
    <Header hoverEffect={hoverEffectEnabled} showButtons={props.isExpanded} onClick={onClick}>
      <HeaderLeft>
        {props.dragDisabled ?
          <Spacer ref={ref}>
            <Domino src="images/domino.svg" alt="" />
          </Spacer>
          :
          <DragSection ref={ref}>
            <Domino src="images/domino.svg" alt="" />
          </DragSection>
        }
        <Icon src={props.task.source.logo} alt="icon"></Icon>
        {expanded_body === props.task.id ? <Title>{props.task.title}</Title> : <TitleWrap>{props.task.title}</TitleWrap>}
      </HeaderLeft>
      <HeaderRight>
        {countdown
          ? <flex.flex>in<Space /><Black>{countdown}</Black></flex.flex>
          : expanded_body === props.task.id
            ? props.task.sender
            : <Truncated>{props.task.sender}</Truncated>
        }
        {
          props.task.conference_call &&
          <HoverButton>
            <JoinConferenceButton conferenceCall={props.task.conference_call} />
          </HoverButton>
        }
        {props.task.source.is_completable &&
          <HoverButton><GTButton theme="black" onClick={(e) => {
            if (e != null) {
              e.stopPropagation()
            }
            done(props.task.id)
          }}
          >
            Done</GTButton></HoverButton>}
      </HeaderRight>
    </Header>
  )
})

const done = async (task_id: string) => {
  try {
    store.dispatch(removeTaskById(task_id))
    const response = await makeAuthorizedRequest({
      url: TASKS_MODIFY_URL + task_id + '/',
      method: 'PATCH',
      body: JSON.stringify({ 'is_completed': true })
    })

    if (!response.ok) {
      throw new Error('PATCH /tasks/modify Mark as Done failed: ' + response.text())
    }
    await fetchTasks()
  } catch (e) {
    console.log({ e })
  }
}

export default TaskHeader
