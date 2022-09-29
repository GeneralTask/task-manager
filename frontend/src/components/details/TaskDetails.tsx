import { useEffect, useState } from 'react'
import { useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ReactTooltip from 'react-tooltip'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { DETAILS_SYNC_TIMEOUT, SINGLE_SECOND_INTERVAL, TASK_PRIORITIES } from '../../constants'
import { useInterval } from '../../hooks'
import { TModifyTaskData, useModifyTask } from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { linearStatus, logos } from '../../styles/images'
import { TTask } from '../../utils/types'
import GTTextArea from '../atoms/GTTextArea'
import { Icon } from '../atoms/Icon'
import { MeetingStartText } from '../atoms/MeetingStartText'
import { Divider } from '../atoms/SectionDivider'
import Spinner from '../atoms/Spinner'
import TimeRange from '../atoms/TimeRange'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import GTButton from '../atoms/buttons/GTButton'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import ActionOption from '../molecules/ActionOption'
import GTDatePicker from '../molecules/GTDatePicker'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'
import LinearCommentList from './linear/LinearCommentList'
import SlackMessage from './slack/SlackMessage'

const DetailsTopContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-basis: 50px;
    flex-shrink: 0;
`
const MarginLeftAuto = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: auto;
`
const MarginLeft8 = styled.div`
    margin-left: ${Spacing._8};
`
const BodyContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    flex-basis: 750px;
`
const TaskStatusContainer = styled.div`
    display: flex;
    gap: ${Spacing._8};
    align-items: center;
`

const MeetingPreparationTimeContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._24};
    margin-left: ${Spacing._8};
    color: ${Colors.text.light};
    ${Typography.label};
    ${Typography.bold};
`
const CommentContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._24};
`

const SYNC_MESSAGES = {
    SYNCING: 'Syncing...',
    ERROR: 'There was an error syncing with our servers',
    COMPLETE: '',
}

const TITLE_MAX_HEIGHT = 208
const BODY_MAX_HEIGHT = 200

interface TaskDetailsProps {
    task: TTask
    link: string
}
const TaskDetails = ({ task, link }: TaskDetailsProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [sectionEditorShown, setSectionEditorShown] = useState(false)
    const [syncIndicatorText, setSyncIndicatorText] = useState(SYNC_MESSAGES.COMPLETE)

    const { mutate: modifyTask, isError, isLoading } = useModifyTask()
    const timers = useRef<{ [key: string]: { timeout: NodeJS.Timeout; callback: () => void } }>({})

    const navigate = useNavigate()
    const location = useLocation()

    const [meetingStartText, setMeetingStartText] = useState<string | null>(null)
    const { is_meeting_preparation_task, meeting_preparation_params } = task
    const dateTimeStart = DateTime.fromISO(meeting_preparation_params?.datetime_start || '')
    const dateTimeEnd = DateTime.fromISO(meeting_preparation_params?.datetime_end || '')

    useInterval(() => {
        if (!task.meeting_preparation_params) return
        const minutes = Math.ceil(dateTimeStart.diffNow('minutes').minutes)
        if (minutes < 0) {
            setMeetingStartText('Meeting is now')
        } else if (minutes <= 30) {
            const minutesText = minutes === 1 ? 'minute' : 'minutes'
            setMeetingStartText(`Starts in ${minutes} ${minutesText}`)
        } else {
            setMeetingStartText('')
        }
    }, SINGLE_SECOND_INTERVAL)

    useEffect(() => {
        if (isEditing || isLoading) {
            setSyncIndicatorText(SYNC_MESSAGES.SYNCING)
        } else if (isError) {
            setSyncIndicatorText(SYNC_MESSAGES.ERROR)
        } else {
            setSyncIndicatorText(SYNC_MESSAGES.COMPLETE)
        }
    }, [isError, isLoading, isEditing])

    /* when the optimistic ID changes to undefined, we know that that task.id is now the real ID
    so we can then navigate to the correct link */
    useEffect(() => {
        if (!task.isOptimistic && location.pathname !== link) {
            navigate(link)
        }
    }, [task.isOptimistic, location, link])

    useEffect(() => {
        ReactTooltip.rebuild()
        return () => {
            for (const timer of Object.values(timers.current)) {
                timer.callback()
                clearTimeout(timer.timeout)
            }
        }
    }, [])

    const syncDetails = useCallback(
        ({ id, title, body }: TModifyTaskData) => {
            setIsEditing(false)
            const timerId = id + (title === undefined ? 'body' : 'title')
            if (timers.current[timerId]) clearTimeout(timers.current[timerId].timeout)
            modifyTask({ id, title, body })
        },
        [task.id, modifyTask]
    )

    const onEdit = useCallback(
        ({ id, title, body }: TModifyTaskData) => {
            setIsEditing(true)
            const timerId = id + (title === undefined ? 'body' : 'title') // we're only modifying the body or title, one at a time
            if (timers.current[timerId]) clearTimeout(timers.current[timerId].timeout)
            timers.current[timerId] = {
                timeout: setTimeout(() => syncDetails({ id, title, body }), DETAILS_SYNC_TIMEOUT * 1000),
                callback: () => syncDetails({ id, title, body }),
            }
        },
        [syncDetails]
    )

    const status = task.external_status ? task.external_status.state : ''

    return (
        <DetailsViewTemplate>
            <DetailsTopContainer>
                <MarginLeft8>
                    <Icon icon={logos[task.source.logo_v2]} />
                </MarginLeft8>
                {!task.isOptimistic && (
                    <>
                        <SubtitleSmall>{syncIndicatorText}</SubtitleSmall>
                        <MarginLeftAuto>
                            {!is_meeting_preparation_task && (
                                <ActionOption
                                    isShown={sectionEditorShown}
                                    setIsShown={setSectionEditorShown}
                                    task={task}
                                    keyboardShortcut="showSectionEditor"
                                />
                            )}
                            {task.deeplink && <ExternalLinkButton link={task.deeplink} />}
                        </MarginLeftAuto>
                    </>
                )}
            </DetailsTopContainer>
            <div>
                <GTTextArea
                    initialValue={task.title}
                    disabled={task.isOptimistic || is_meeting_preparation_task}
                    onEdit={(val) => onEdit({ id: task.id, title: val })}
                    maxHeight={TITLE_MAX_HEIGHT}
                    fontSize="medium"
                    blurOnEnter
                />
            </div>
            {meeting_preparation_params && (
                <MeetingPreparationTimeContainer>
                    <TimeRange start={dateTimeStart} end={dateTimeEnd} />
                    <MeetingStartText isTextColored>{meetingStartText}</MeetingStartText>
                </MeetingPreparationTimeContainer>
            )}
            <TaskStatusContainer>
                {task.external_status && task.all_statuses && (
                    <GTDropdownMenu
                        items={task.all_statuses.map((status) => ({
                            label: status.state,
                            onClick: () => modifyTask({ id: task.id, status: status }),
                            icon: linearStatus[status.type],
                        }))}
                        trigger={
                            <GTButton
                                value={status}
                                icon={linearStatus[task.external_status.type]}
                                size="small"
                                styleType="simple"
                            />
                        }
                    />
                )}
                <GTDatePicker
                    initialDate={DateTime.fromISO(task.due_date).toJSDate()}
                    setDate={(date) => modifyTask({ id: task.id, dueDate: date })}
                />
                <GTDropdownMenu
                    items={TASK_PRIORITIES.map((priority, val) => ({
                        label: priority.label,
                        onClick: () => modifyTask({ id: task.id, priorityNormalized: val }),
                        icon: priority.icon,
                        iconColor: TASK_PRIORITIES[val].color,
                    }))}
                    trigger={
                        <GTButton
                            value={TASK_PRIORITIES[task.priority_normalized].label}
                            icon={TASK_PRIORITIES[task.priority_normalized].icon}
                            size="small"
                            styleType="simple"
                            iconColor={TASK_PRIORITIES[task.priority_normalized].color}
                            asDiv
                        />
                    }
                />
            </TaskStatusContainer>
            {task.isOptimistic ? (
                <Spinner />
            ) : (
                <>
                    <BodyContainer>
                        <GTTextArea
                            initialValue={task.body}
                            placeholder="Add details"
                            isFullHeight={!task.slack_message_params}
                            onEdit={(val) => onEdit({ id: task.id, body: val })}
                            maxHeight={BODY_MAX_HEIGHT}
                            fontSize="small"
                        />
                    </BodyContainer>
                    {task.comments && (
                        <CommentContainer>
                            <Divider color={Colors.border.extra_light} />
                            <LinearCommentList comments={task.comments} />
                        </CommentContainer>
                    )}
                    {task.slack_message_params && (
                        <SlackMessage sender={task.sender} slack_message_params={task.slack_message_params} />
                    )}
                </>
            )}
        </DetailsViewTemplate>
    )
}

export default TaskDetails
