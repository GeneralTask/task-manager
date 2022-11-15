import { useCallback, useRef } from 'react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ReactTooltip from 'react-tooltip'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import {
    DETAILS_SYNC_TIMEOUT,
    GENERAL_TASK_SOURCE_NAME,
    SINGLE_SECOND_INTERVAL,
    TRASH_SECTION_ID,
} from '../../constants'
import { useInterval, usePreviewMode } from '../../hooks'
import { TModifyTaskData, useMarkTaskDoneOrDeleted, useModifyTask } from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TTask } from '../../utils/types'
import GTTextField from '../atoms/GTTextField'
import { Icon } from '../atoms/Icon'
import { MeetingStartText } from '../atoms/MeetingStartText'
import NoStyleLink from '../atoms/NoStyleLink'
import { Divider } from '../atoms/SectionDivider'
import Spinner from '../atoms/Spinner'
import TimeRange from '../atoms/TimeRange'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import GTButton from '../atoms/buttons/GTButton'
import { Label } from '../atoms/typography/Typography'
import CreateLinearComment from '../molecules/CreateLinearComment'
import GTDatePicker from '../molecules/GTDatePicker'
import SubtaskList from '../molecules/subtasks/SubtaskList'
import FolderDropdown from '../radix/FolderDropdown'
import LinearStatusDropdown from '../radix/LinearStatusDropdown'
import PriorityDropdown from '../radix/PriorityDropdown'
import TaskActionsDropdown from '../radix/TaskActionsDropdown'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'
import TaskBody from './TaskBody'
import LinearCommentList from './linear/LinearCommentList'
import SlackMessage from './slack/SlackMessage'

const TITLE_MAX_HEIGHT = 208
const TASK_TITLE_MAX_WIDTH = 125

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
const DetailItem = styled.div`
    display: flex;
    align-items: center;
    margin-left: ${Spacing._8};
    max-width: ${TASK_TITLE_MAX_WIDTH}px;
    display: block;
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
const BackButtonContainer = styled(NoStyleLink)`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    ${Typography.mini};
`
const BackButtonText = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

const SYNC_MESSAGES = {
    SYNCING: 'Syncing...',
    ERROR: 'There was an error syncing with our servers',
    COMPLETE: '',
}

interface TaskDetailsProps {
    task: TTask
    subtask?: TTask
    link: string
}
const TaskDetails = ({ task, subtask, link }: TaskDetailsProps) => {
    const currentTask = subtask || task
    const [isEditing, setIsEditing] = useState(false)
    const [syncIndicatorText, setSyncIndicatorText] = useState(SYNC_MESSAGES.COMPLETE)

    const { mutate: modifyTask, isError, isLoading } = useModifyTask()
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()
    const { isPreviewMode } = usePreviewMode()
    const timers = useRef<{ [key: string]: { timeout: NodeJS.Timeout; callback: () => void } }>({})

    const navigate = useNavigate()
    const location = useLocation()
    const params = useParams()

    const [meetingStartText, setMeetingStartText] = useState<string | null>(null)
    const { is_meeting_preparation_task, meeting_preparation_params } = currentTask
    const dateTimeStart = DateTime.fromISO(meeting_preparation_params?.datetime_start || '')
    const dateTimeEnd = DateTime.fromISO(meeting_preparation_params?.datetime_end || '')

    const isInTrash = params.section === TRASH_SECTION_ID

    useInterval(() => {
        if (!currentTask.meeting_preparation_params) return
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
        if (!currentTask.optimisticId && location.pathname !== link) {
            navigate(link)
        }
    }, [currentTask.optimisticId, location, link])

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
        [currentTask.id, modifyTask]
    )

    const onEdit = ({ id, title, body }: TModifyTaskData) => {
        setIsEditing(true)
        const timerId = id + (title === undefined ? 'body' : 'title') // we're only modifying the body or title, one at a time
        if (timers.current[timerId]) clearTimeout(timers.current[timerId].timeout)
        timers.current[timerId] = {
            timeout: setTimeout(() => syncDetails({ id, title, body }), DETAILS_SYNC_TIMEOUT),
            callback: () => syncDetails({ id, title, body }),
        }
    }

    return (
        <DetailsViewTemplate>
            <DetailsTopContainer>
                <DetailItem>
                    {subtask ? (
                        <BackButtonContainer to=".." relative="path">
                            <Icon icon={icons.caret_left} color="purple" />
                            <BackButtonText>{task.title}</BackButtonText>
                        </BackButtonContainer>
                    ) : (
                        <Icon icon={logos[currentTask.source.logo_v2]} />
                    )}
                </DetailItem>
                {!currentTask.optimisticId && (
                    <>
                        <DetailItem>
                            <Label color="light">{syncIndicatorText}</Label>
                        </DetailItem>
                        {!subtask && (
                            <MarginLeftAuto>
                                {isInTrash && (
                                    <GTButton
                                        value="Restore Task"
                                        onClick={() =>
                                            markTaskDoneOrDeleted(
                                                { id: currentTask.id, isDeleted: false },
                                                currentTask.optimisticId && currentTask.id
                                            )
                                        }
                                        styleType="secondary"
                                        size="small"
                                    />
                                )}
                                {!is_meeting_preparation_task && <FolderDropdown task={currentTask} />}
                                {currentTask.deeplink && <ExternalLinkButton link={currentTask.deeplink} />}
                                <TaskActionsDropdown task={currentTask} />
                            </MarginLeftAuto>
                        )}
                    </>
                )}
            </DetailsTopContainer>
            <div>
                <GTTextField
                    type="plaintext"
                    itemId={currentTask.id}
                    value={isInTrash ? `${currentTask.title} (deleted)` : currentTask.title}
                    disabled={
                        !!currentTask.optimisticId ||
                        is_meeting_preparation_task ||
                        currentTask.nux_number_id > 0 ||
                        isInTrash
                    }
                    onChange={(val) => onEdit({ id: currentTask.id, title: val })}
                    maxHeight={TITLE_MAX_HEIGHT}
                    fontSize="medium"
                    hideUnfocusedOutline
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
                <PriorityDropdown task={currentTask} disabled={isInTrash} />
                <GTDatePicker
                    initialDate={DateTime.fromISO(currentTask.due_date).toJSDate()}
                    setDate={(date) => modifyTask({ id: currentTask.id, dueDate: date })}
                    disabled={isInTrash}
                />
                <MarginLeftAuto>
                    <LinearStatusDropdown task={currentTask} disabled={isInTrash} />
                </MarginLeftAuto>
            </TaskStatusContainer>
            {currentTask.optimisticId ? (
                <Spinner />
            ) : (
                <>
                    <TaskBody
                        task={currentTask}
                        onChange={(val) => onEdit({ id: currentTask.id, body: val })}
                        disabled={isInTrash}
                    />
                    {currentTask.source.name === GENERAL_TASK_SOURCE_NAME && isPreviewMode && !isInTrash && (
                        <SubtaskList taskId={currentTask.id} subtasks={currentTask.sub_tasks ?? []} />
                    )}
                    {currentTask.external_status && (
                        <CommentContainer>
                            <Divider color={Colors.border.extra_light} />
                            <LinearCommentList comments={currentTask.comments ?? []} />
                        </CommentContainer>
                    )}
                    {isPreviewMode && currentTask.external_status && !isInTrash && (
                        <CreateLinearComment taskId={currentTask.id} numComments={currentTask.comments?.length ?? 0} />
                    )}
                    {currentTask.slack_message_params && (
                        <SlackMessage
                            sender={currentTask.sender}
                            slack_message_params={currentTask.slack_message_params}
                        />
                    )}
                </>
            )}
        </DetailsViewTemplate>
    )
}

export default TaskDetails
