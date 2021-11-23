import './Task.css'

import * as styles from './TaskHeader-style'

import { NOW, TASKS_MODIFY_URL } from '../../constants'
import React, { useCallback } from 'react'
import { expandBody, removeTaskById, retractBody } from '../../redux/actions'
import { fetchTasks, makeAuthorizedRequest } from '../../helpers/utils'

import GTButton from '../common/GTButton'
import JoinConferenceButton from './JoinConferenceButton'
import { TTask } from '../../helpers/types'
import { flex } from '../../helpers/styles'
import store from '../../redux/store'
import { useCountdown } from './TaskWrappers'

interface Props {
  task: TTask,
  datetimeStart: string | null, // null if unscheduled_task
  dragDisabled: boolean,
  isExpanded: boolean,
}

const TaskHeader = React.forwardRef<HTMLDivElement, Props>((props: Props, ref) => {
  const countdown = useCountdown(props.datetimeStart)

  const hoverEffectEnabled = !!(props.task.body || props.task.deeplink)

  const onClick = useCallback(() => {
    if (hoverEffectEnabled) {
      if (props.isExpanded) {
        store.dispatch(retractBody())
      }
      else {
        store.dispatch(expandBody(props.task.id))
      }
    }
  }, [hoverEffectEnabled, props.isExpanded])

  return (
    <styles.Header hoverEffect={hoverEffectEnabled} showButtons={props.isExpanded} onClick={onClick}>
      <styles.HeaderLeft>
        {props.dragDisabled ?
          <styles.Spacer ref={ref}>
            <styles.Domino src="images/domino.svg" alt="" />
          </styles.Spacer>
          :
          <styles.DragSection ref={ref}>
            <styles.Domino src="images/domino.svg" alt="" />
          </styles.DragSection>
        }
        <styles.Icon src={props.task.source.logo} alt="icon"></styles.Icon>
        {props.isExpanded ? <styles.Title>{props.task.title}</styles.Title> : <styles.TitleWrap>{props.task.title}</styles.TitleWrap>}
      </styles.HeaderLeft>
      <styles.HeaderRight>
        {countdown
          ? <flex.flex>
            {countdown !== NOW && <>in < styles.Space /></>}
            <styles.Black>{countdown}</styles.Black>
          </flex.flex>
          : props.isExpanded
            ? props.task.sender
            : <styles.Truncated>{props.task.sender}</styles.Truncated>
        }
        {
          props.task.conference_call &&
          <styles.HoverButton>
            <JoinConferenceButton conferenceCall={props.task.conference_call} />
          </styles.HoverButton>
        }
        {props.task.source.is_completable &&
          <styles.HoverButton><GTButton theme="black" onClick={(e) => {
            if (e != null) {
              e.stopPropagation()
            }
            done(props.task.id)
          }}
          >
            Done</GTButton></styles.HoverButton>}
      </styles.HeaderRight>
    </styles.Header>
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
