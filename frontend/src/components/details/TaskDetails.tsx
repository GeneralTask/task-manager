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
import { icons, linearStatus, logos } from '../../styles/images'
import { TTask } from '../../utils/types'
import GTTextArea from '../atoms/GTTextArea'
import { Icon } from '../atoms/Icon'
import { MeetingStartText } from '../atoms/MeetingStartText'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import Spinner from '../atoms/Spinner'
import TimeRange from '../atoms/TimeRange'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import ActionOption from '../molecules/ActionOption'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'
import LinearCommentList from './linear/LinearCommentList'
import SlackMessage from './slack/SlackMessage'

const DetailsTopContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 50px;
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
const StatusContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._8};
    align-items: center;
    color: ${Colors.text.light};
    ${Typography.bodySmall};
`
const BodyContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
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
        <DetailsViewTemplate data-testid="details-view-container">
            <DetailsTopContainer>
                <MarginLeft8>
                    <Icon icon={logos[task.source.logo_v2]} size="small" />
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
                            {task.deeplink && (
                                <NoStyleAnchor href={task.deeplink} target="_blank" rel="noreferrer">
                                    <GTIconButton icon={icons.external_link} size="small" />
                                </NoStyleAnchor>
                            )}
                        </MarginLeftAuto>
                    </>
                )}
            </DetailsTopContainer>
            <GTTextArea
                initialValue={task.title}
                disabled={task.isOptimistic || is_meeting_preparation_task}
                onEdit={(val) => onEdit({ id: task.id, title: val })}
                maxHeight={TITLE_MAX_HEIGHT}
                fontSize="medium"
                blurOnEnter
            />
            {meeting_preparation_params && (
                <MeetingPreparationTimeContainer>
                    <TimeRange start={dateTimeStart} end={dateTimeEnd} />
                    <MeetingStartText isTextColored>{meetingStartText}</MeetingStartText>
                </MeetingPreparationTimeContainer>
            )}
            <TaskStatusContainer>
                {task.external_status && (
                    <StatusContainer>
                        <Icon icon={linearStatus[task.external_status.type]} size="small" />
                        {status}
                    </StatusContainer>
                )}
                <GTDropdownMenu
                    items={TASK_PRIORITIES.map((priority, val) => ({
                        label: priority.label,
                        onClick: () => modifyTask({ id: task.id, priorityNormalized: val }),
                        icon: priority.icon,
                    }))}
                    trigger={
                        <GTButton
                            value={TASK_PRIORITIES[task.priority_normalized].label}
                            icon={TASK_PRIORITIES[task.priority_normalized].icon}
                            size="small"
                            styleType="simple"
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
                    {task.comments && <LinearCommentList comments={task.comments} />}
                    {task.slack_message_params && (
                        <SlackMessage sender={task.sender} slack_message_params={task.slack_message_params} />
                    )}
                </>
            )}
        </DetailsViewTemplate>
    )
}

export default TaskDetails
