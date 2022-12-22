import { useCallback, useRef } from 'react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import {
    DETAILS_SYNC_TIMEOUT,
    EMPTY_MONGO_OBJECT_ID,
    GENERAL_TASK_SOURCE_NAME,
    NO_TITLE,
    SINGLE_SECOND_INTERVAL,
    SYNC_MESSAGES,
    TRASH_SECTION_ID,
} from '../../constants'
import { useInterval, useKeyboardShortcut } from '../../hooks'
import { useModifyRecurringTask } from '../../services/api/recurring-tasks.hooks'
import {
    TModifyTaskData,
    useGetTasks,
    useMarkTaskDoneOrDeleted,
    useModifyTask,
    useReorderTask,
} from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TRecurringTaskTemplate, TTask } from '../../utils/types'
import { getFolderIdFromTask } from '../../utils/utils'
import GTTextField from '../atoms/GTTextField'
import { Icon } from '../atoms/Icon'
import { MeetingStartText } from '../atoms/MeetingStartText'
import NoStyleLink from '../atoms/NoStyleLink'
import { Divider } from '../atoms/SectionDivider'
import Spinner from '../atoms/Spinner'
import TimeRange from '../atoms/TimeRange'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Label } from '../atoms/typography/Typography'
import CreateLinearComment from '../molecules/CreateLinearComment'
import FolderSelector from '../molecules/FolderSelector'
import GTDatePicker from '../molecules/GTDatePicker'
import DeleteRecurringTaskTemplateButton from '../molecules/recurring-tasks/DeleteRecurringTaskTemplateButton'
import RecurringTaskDetailsBanner from '../molecules/recurring-tasks/RecurringTaskDetailsBanner'
import RecurringTaskTemplateDetailsBanner from '../molecules/recurring-tasks/RecurringTaskTemplateDetailsBanner'
import RecurringTaskTemplateScheduleButton from '../molecules/recurring-tasks/RecurringTaskTemplateScheduleButton'
import SubtaskList from '../molecules/subtasks/SubtaskList'
import JiraPriorityDropdown from '../radix/JiraPriorityDropdown'
import JiraStatusDropdown from '../radix/JiraStatusDropdown'
import LinearStatusDropdown from '../radix/LinearStatusDropdown'
import PriorityDropdown from '../radix/PriorityDropdown'
import TaskActionsDropdown from '../radix/TaskActionsDropdown'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'
import TaskBody from './TaskBody'
import LinearCommentList from './linear/LinearCommentList'
import SlackMessage from './slack/SlackMessage'

const TITLE_MAX_HEIGHT = 208

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
const BackButtonText = styled(Label)`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: inherit;
`

interface TaskDetailsProps {
    task: Partial<TTask> & Partial<TRecurringTaskTemplate> & { id: string; title: string }
    link: string
    subtask?: TTask
    isRecurringTaskTemplate?: boolean
}
const TaskDetails = ({ task, link, subtask, isRecurringTaskTemplate }: TaskDetailsProps) => {
    const currentTask = subtask || task
    const [isEditing, setIsEditing] = useState(false)
    const [syncIndicatorText, setSyncIndicatorText] = useState(SYNC_MESSAGES.COMPLETE)

    const { mutate: modifyTask, isError, isLoading } = useModifyTask()
    const { mutate: reorderTask } = useReorderTask()
    const { mutate: modifyRecurringTask } = useModifyRecurringTask()

    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()
    const timers = useRef<{ [key: string]: { timeout: NodeJS.Timeout; callback: () => void } }>({})

    const navigate = useNavigate()
    const location = useLocation()

    const [meetingStartText, setMeetingStartText] = useState<string | null>(null)
    const { is_meeting_preparation_task, meeting_preparation_params } = currentTask as TTask
    const dateTimeStart = DateTime.fromISO(meeting_preparation_params?.datetime_start || '')
    const dateTimeEnd = DateTime.fromISO(meeting_preparation_params?.datetime_end || '')

    const titleRef = useRef<HTMLTextAreaElement>(null)

    useInterval(() => {
        if (!meeting_preparation_params) return
        const minutesToStart = Math.ceil(dateTimeStart.diffNow('minutes').minutes)
        const minutesToEnd = Math.ceil(dateTimeEnd.diffNow('minutes').minutes)
        if (minutesToStart < 0 && minutesToEnd > 0) {
            setMeetingStartText('Meeting is now')
        } else if (minutesToStart < 0 && minutesToEnd < 0) {
            setMeetingStartText(null)
        } else if (minutesToStart <= 30) {
            const minutesToStartText = minutesToStart === 1 ? 'minute' : 'minutes'
            setMeetingStartText(`Starts in ${minutesToStart} ${minutesToStartText}`)
        } else {
            setMeetingStartText(null)
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
            navigate(link, { replace: true })
        }
    }, [currentTask.optimisticId, location, link])

    useEffect(() => {
        titleRef.current?.addEventListener('focus', () => {
            if (titleRef.current?.value === NO_TITLE) {
                titleRef?.current?.select()
            }
        })
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
            const isEditingTitle = title !== undefined
            if (isEditingTitle && title === '' && titleRef.current) {
                title = NO_TITLE
                titleRef.current.value = NO_TITLE
                if (document.activeElement === titleRef.current) {
                    titleRef.current.select()
                }
            }
            const timerId = id + (isEditingTitle ? title : 'body')
            if (timers.current[timerId]) clearTimeout(timers.current[timerId].timeout)
            if (isRecurringTaskTemplate) {
                modifyRecurringTask(
                    {
                        id,
                        title,
                        body,
                    },
                    currentTask.optimisticId
                )
            } else {
                modifyTask({ id, title, body }, currentTask.optimisticId)
            }
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

    useKeyboardShortcut(
        'editTaskName',
        useCallback(() => titleRef.current?.select(), [])
    )

    const { data: folders } = useGetTasks()
    const folderId = getFolderIdFromTask(folders ?? [], currentTask.id)
    const isInTrash = folderId === TRASH_SECTION_ID

    useKeyboardShortcut(
        'backToParentTask',
        useCallback(() => {
            if (subtask) {
                navigate('..', { relative: 'path' })
            }
        }, [subtask])
    )

    return (
        <DetailsViewTemplate>
            <DetailsTopContainer>
                <DetailItem>
                    {subtask ? (
                        <BackButtonContainer to=".." relative="path">
                            <Icon icon={icons.caret_left} color="purple" />
                            <BackButtonText>Return to parent task</BackButtonText>
                        </BackButtonContainer>
                    ) : (
                        <Icon icon={logos[currentTask?.source?.logo_v2 ?? 'generaltask']} />
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
                                {!is_meeting_preparation_task && !isRecurringTaskTemplate && folderId && (
                                    <FolderSelector
                                        value={folderId}
                                        onChange={(newFolderId) =>
                                            reorderTask(
                                                {
                                                    id: currentTask.id,
                                                    dropSectionId: newFolderId,
                                                    dragSectionId: folderId,
                                                    orderingId: 1,
                                                },
                                                currentTask.optimisticId
                                            )
                                        }
                                        renderTrigger={(isOpen, setIsOpen) => (
                                            <GTIconButton
                                                icon={icons.folder}
                                                onClick={() => setIsOpen(!isOpen)}
                                                forceShowHoverEffect={isOpen}
                                                asDiv
                                            />
                                        )}
                                        enableKeyboardShortcut
                                    />
                                )}
                                {currentTask.deeplink && <ExternalLinkButton link={currentTask.deeplink} />}
                                {!isRecurringTaskTemplate && <TaskActionsDropdown task={currentTask as TTask} />}
                                {isRecurringTaskTemplate && <DeleteRecurringTaskTemplateButton templateId={task.id} />}
                            </MarginLeftAuto>
                        )}
                    </>
                )}
            </DetailsTopContainer>
            <div>
                <GTTextField
                    type="plaintext"
                    ref={titleRef}
                    itemId={currentTask.id}
                    value={isInTrash ? `${currentTask.title} (deleted)` : currentTask.title}
                    disabled={
                        !!currentTask.optimisticId ||
                        is_meeting_preparation_task ||
                        !!currentTask.nux_number_id ||
                        isInTrash
                    }
                    onChange={(val) => onEdit({ id: currentTask.id, title: val })}
                    maxHeight={TITLE_MAX_HEIGHT}
                    fontSize="medium"
                    hideUnfocusedOutline
                    enterBehavior="blur"
                />
            </div>
            {meeting_preparation_params && (
                <MeetingPreparationTimeContainer>
                    <TimeRange start={dateTimeStart} end={dateTimeEnd} />
                    <MeetingStartText isTextColored>{meetingStartText}</MeetingStartText>
                </MeetingPreparationTimeContainer>
            )}
            <TaskStatusContainer>
                {task.source?.name === 'Jira' && task.priority && task.all_priorities ? (
                    <JiraPriorityDropdown
                        taskId={task.id}
                        currentPriority={task.priority}
                        allPriorities={task.all_priorities}
                    />
                ) : (
                    <PriorityDropdown
                        value={currentTask.priority_normalized ?? 0}
                        onChange={(priority) =>
                            isRecurringTaskTemplate
                                ? modifyRecurringTask(
                                      { id: currentTask.id, priority_normalized: priority },
                                      currentTask.optimisticId
                                  )
                                : modifyTask(
                                      { id: task.id, priorityNormalized: priority, subtaskId: subtask?.id },
                                      currentTask.optimisticId
                                  )
                        }
                        disabled={isInTrash}
                    />
                )}
                {!isRecurringTaskTemplate && (
                    <GTDatePicker
                        initialDate={DateTime.fromISO(currentTask.due_date ?? '').toJSDate()}
                        setDate={(date) => modifyTask({ id: task.id, dueDate: date, subtaskId: subtask?.id })}
                        disabled={isInTrash}
                    />
                )}
                {isRecurringTaskTemplate ? (
                    <RecurringTaskTemplateScheduleButton templateId={task.id} />
                ) : (
                    task.source?.name === 'General Task' &&
                    subtask === undefined && (
                        <RecurringTaskTemplateScheduleButton
                            templateId={currentTask.recurring_task_template_id}
                            task={currentTask as TTask}
                            folderId={folderId}
                        />
                    )
                )}
                <MarginLeftAuto>
                    {!isRecurringTaskTemplate && task.external_status && task.all_statuses && (
                        <>
                            {task.source?.name === 'Linear' && (
                                <LinearStatusDropdown task={currentTask as TTask} disabled={isInTrash} />
                            )}
                            {task.source?.name === 'Jira' && (
                                <JiraStatusDropdown task={currentTask as TTask} disabled={isInTrash} />
                            )}
                        </>
                    )}
                </MarginLeftAuto>
            </TaskStatusContainer>
            {currentTask.optimisticId ? (
                <Spinner />
            ) : (
                <>
                    {/* TODO: remove empty ObjectId check once backend stops giving us empty object ids */}
                    {!isRecurringTaskTemplate &&
                        currentTask.recurring_task_template_id &&
                        currentTask.recurring_task_template_id !== EMPTY_MONGO_OBJECT_ID &&
                        folderId && <RecurringTaskDetailsBanner templateId={currentTask.recurring_task_template_id} />}
                    {isRecurringTaskTemplate && task.id_task_section && (
                        <RecurringTaskTemplateDetailsBanner id={task.id} folderId={task.id_task_section} />
                    )}
                    <TaskBody
                        id={currentTask.id}
                        body={currentTask.body ?? ''}
                        onChange={(val) => onEdit({ id: currentTask.id, body: val })}
                        disabled={isInTrash}
                        nux_number_id={currentTask.nux_number_id}
                    />
                    {currentTask.source?.name === GENERAL_TASK_SOURCE_NAME && !isInTrash && (
                        <SubtaskList parentTask={currentTask as TTask} subtasks={currentTask.sub_tasks ?? []} />
                    )}
                    {currentTask.external_status && (
                        <CommentContainer>
                            <Divider color={Colors.border.extra_light} />
                            <LinearCommentList comments={currentTask.comments ?? []} />
                        </CommentContainer>
                    )}
                    {currentTask.source?.name !== 'Jira' && currentTask.external_status && !isInTrash && (
                        <CreateLinearComment taskId={currentTask.id} numComments={currentTask.comments?.length ?? 0} />
                    )}
                    {currentTask.slack_message_params && currentTask.sender && (
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
