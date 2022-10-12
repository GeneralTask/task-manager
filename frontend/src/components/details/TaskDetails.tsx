import { useCallback, useRef } from 'react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ReactTooltip from 'react-tooltip'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { DETAILS_SYNC_TIMEOUT, SINGLE_SECOND_INTERVAL, TRASH_SECTION_ID } from '../../constants'
import { useInterval } from '../../hooks'
import { TModifyTaskData, useMarkTaskDoneOrDeleted, useModifyTask, usePostComment } from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TTask } from '../../utils/types'
import GTTextField from '../atoms/GTTextField'
import { Icon } from '../atoms/Icon'
import { MeetingStartText } from '../atoms/MeetingStartText'
import { Divider } from '../atoms/SectionDivider'
import Spinner from '../atoms/Spinner'
import TimeRange from '../atoms/TimeRange'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import GTButton from '../atoms/buttons/GTButton'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import GTDatePicker from '../molecules/GTDatePicker'
import FolderDropdown from '../radix/FolderDropdown'
import LinearStatusDropdown from '../radix/LinearStatusDropdown'
import PriorityDropdown from '../radix/PriorityDropdown'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'
import TaskBody from './TaskBody'
import LinearCommentList from './linear/LinearCommentList'
import SlackMessage from './slack/SlackMessage'

const TITLE_MAX_HEIGHT = 208
const LINEAR_ADD_COMMENT_HEIGHT = 100

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
const BottomStickyContainer = styled.div`
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    /* margin-top: ${LINEAR_ADD_COMMENT_HEIGHT}px; */
`

const SYNC_MESSAGES = {
    SYNCING: 'Syncing...',
    ERROR: 'There was an error syncing with our servers',
    COMPLETE: '',
}

interface TaskDetailsProps {
    task: TTask
    link: string
}
const TaskDetails = ({ task, link }: TaskDetailsProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [syncIndicatorText, setSyncIndicatorText] = useState(SYNC_MESSAGES.COMPLETE)

    const { mutate: modifyTask, isError, isLoading } = useModifyTask()
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()
    const { mutate: postComment } = usePostComment()
    const timers = useRef<{ [key: string]: { timeout: NodeJS.Timeout; callback: () => void } }>({})

    const navigate = useNavigate()
    const location = useLocation()
    const params = useParams()

    const [meetingStartText, setMeetingStartText] = useState<string | null>(null)
    const { is_meeting_preparation_task, meeting_preparation_params } = task
    const dateTimeStart = DateTime.fromISO(meeting_preparation_params?.datetime_start || '')
    const dateTimeEnd = DateTime.fromISO(meeting_preparation_params?.datetime_end || '')

    const isInTrash = params.section === TRASH_SECTION_ID

    const [comment, setComment] = useState('')

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

    const onEdit = ({ id, title, body }: TModifyTaskData) => {
        setIsEditing(true)
        const timerId = id + (title === undefined ? 'body' : 'title') // we're only modifying the body or title, one at a time
        if (timers.current[timerId]) clearTimeout(timers.current[timerId].timeout)
        timers.current[timerId] = {
            timeout: setTimeout(() => syncDetails({ id, title, body }), DETAILS_SYNC_TIMEOUT * 1000),
            callback: () => syncDetails({ id, title, body }),
        }
    }

    return (
        <DetailsViewTemplate>
            <DetailsTopContainer>
                <MarginLeft8>
                    <Icon icon={logos[task.source.logo_v2]} />
                </MarginLeft8>
                {!task.isOptimistic && (
                    <>
                        <MarginLeft8>
                            <SubtitleSmall>{syncIndicatorText}</SubtitleSmall>
                        </MarginLeft8>
                        <MarginLeftAuto>
                            {isInTrash && (
                                <GTButton
                                    value="Restore Task"
                                    onClick={() => markTaskDoneOrDeleted({ taskId: task.id, isDeleted: false })}
                                    styleType="secondary"
                                    size="small"
                                />
                            )}
                            {!is_meeting_preparation_task && <FolderDropdown task={task} />}
                            {task.deeplink && <ExternalLinkButton link={task.deeplink} />}
                        </MarginLeftAuto>
                    </>
                )}
            </DetailsTopContainer>
            <div>
                <GTTextField
                    type="plaintext"
                    itemId={task.id}
                    value={isInTrash ? `${task.title} (deleted)` : task.title}
                    disabled={task.isOptimistic || is_meeting_preparation_task || task.nux_number_id > 0 || isInTrash}
                    onChange={(val) => onEdit({ id: task.id, title: val })}
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
                <PriorityDropdown task={task} disabled={isInTrash} />
                <GTDatePicker
                    initialDate={DateTime.fromISO(task.due_date).toJSDate()}
                    setDate={(date) => modifyTask({ id: task.id, dueDate: date })}
                    disabled={isInTrash}
                />
                <MarginLeftAuto>
                    <LinearStatusDropdown task={task} disabled={isInTrash} />
                </MarginLeftAuto>
            </TaskStatusContainer>
            {task.isOptimistic ? (
                <Spinner />
            ) : (
                <>
                    <TaskBody task={task} onChange={(val) => onEdit({ id: task.id, body: val })} disabled={isInTrash} />
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
            {task.external_status && (
                <BottomStickyContainer>
                    <GTTextField
                        type="markdown"
                        placeholder="Add a comment"
                        value={comment}
                        fontSize="small"
                        minHeight={LINEAR_ADD_COMMENT_HEIGHT}
                        onChange={setComment}
                        actions={
                            <GTButton
                                value="Comment"
                                styleType="secondary"
                                size="small"
                                onClick={() => {
                                    postComment({ taskId: task.id, body: comment })
                                    setComment('')
                                }}
                            />
                        }
                        isFullHeight
                    />
                </BottomStickyContainer>
            )}
        </DetailsViewTemplate>
    )
}

export default TaskDetails
