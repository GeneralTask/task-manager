import { useCallback, useRef } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import {
    DETAILS_SYNC_TIMEOUT,
    EMPTY_MONGO_OBJECT_ID,
    GENERAL_TASK_SOURCE_NAME,
    NO_TITLE,
    SINGLE_SECOND_INTERVAL,
    SLACK_SOURCE_NAME,
    SYNC_MESSAGES,
    TRASH_FOLDER_ID,
} from '../../constants'
import { useInterval, useKeyboardShortcut } from '../../hooks'
import { useModifyRecurringTask } from '../../services/api/recurring-tasks.hooks'
import {
    TModifyTaskData,
    useMarkTaskDoneOrDeleted,
    useModifyTask,
    useReorderTask,
} from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TRecurringTaskTemplate, TTaskV4 } from '../../utils/types'
import { EMPTY_ARRAY, isTaskParentTask } from '../../utils/utils'
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
import CommentList from './comments/CommentList'
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

const SOURCES_ALLOWED_WITH_SUBTASKS = [GENERAL_TASK_SOURCE_NAME, SLACK_SOURCE_NAME]

interface TaskDetailsProps {
    task: Partial<TTaskV4> & Partial<TRecurringTaskTemplate> & { id: string; title: string }
    isRecurringTaskTemplate?: boolean
}
const TaskDetails = ({ task, isRecurringTaskTemplate }: TaskDetailsProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [syncIndicatorText, setSyncIndicatorText] = useState(SYNC_MESSAGES.COMPLETE)

    const { mutate: modifyTask, isError, isLoading } = useModifyTask()
    const { mutate: reorderTask } = useReorderTask()
    const { mutate: modifyRecurringTask } = useModifyRecurringTask()

    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()
    const timers = useRef<{ [key: string]: { timeout: NodeJS.Timeout; callback: () => void } }>({})

    const navigate = useNavigate()

    const [meetingStartText, setMeetingStartText] = useState<string | null>(null)
    const { meeting_preparation_params } = task
    const dateTimeStart = DateTime.fromISO(meeting_preparation_params?.datetime_start || '')
    const dateTimeEnd = DateTime.fromISO(meeting_preparation_params?.datetime_end || '')

    const isMeetingPreparationTask = !!meeting_preparation_params
    const isSubtask = !!task.id_parent

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
        ({ id, title, body, subtaskId }: TModifyTaskData) => {
            setIsEditing(false)
            const isEditingTitle = title !== undefined
            if (isEditingTitle && title === '' && titleRef.current) {
                title = NO_TITLE
                titleRef.current.value = NO_TITLE
                if (document.activeElement === titleRef.current) {
                    titleRef.current.select()
                }
            }
            const timerId = id + subtaskId + (title === undefined ? 'body' : 'title')
            if (timers.current[timerId]) clearTimeout(timers.current[timerId].timeout)
            if (isRecurringTaskTemplate) {
                modifyRecurringTask(
                    {
                        id,
                        title,
                        body,
                    },
                    task.optimisticId
                )
            } else {
                modifyTask({ id, title, body, subtaskId }, task.optimisticId)
            }
        },
        [task.id, modifyTask]
    )

    const onEdit = ({ id, title, body, idParent }: TModifyTaskData & { idParent: string | undefined }) => {
        let subtaskId: string | undefined = undefined
        let mainId = ''
        if (idParent) {
            subtaskId = id
            mainId = idParent
        } else {
            mainId = id
        }

        setIsEditing(true)
        const timerId = id + subtaskId + (title === undefined ? 'body' : 'title') // we're only modifying the body or title, one at a time
        if (timers.current[timerId]) clearTimeout(timers.current[timerId].timeout)
        timers.current[timerId] = {
            timeout: setTimeout(() => syncDetails({ id: mainId, title, body, subtaskId }), DETAILS_SYNC_TIMEOUT),
            callback: () => syncDetails({ id: mainId, title, body, subtaskId }),
        }
    }

    useKeyboardShortcut(
        'editTaskName',
        useCallback(() => titleRef.current?.select(), [])
    )

    const isInTrash = task.id_folder === TRASH_FOLDER_ID

    useKeyboardShortcut(
        'backToParentTask',
        useCallback(() => {
            if (isSubtask) {
                navigate('..', { relative: 'path' })
            }
        }, [isSubtask])
    )

    const taskv4 = task as TTaskV4

    return (
        <DetailsViewTemplate>
            <DetailsTopContainer>
                <DetailItem>
                    {isSubtask ? (
                        <BackButtonContainer to=".." relative="path">
                            <Icon icon={icons.caret_left} color="purple" />
                            <BackButtonText>Return to parent task</BackButtonText>
                        </BackButtonContainer>
                    ) : (
                        <Icon icon={logos[task?.source?.logo_v2 ?? 'generaltask']} />
                    )}
                </DetailItem>
                {!task.optimisticId && (
                    <>
                        <DetailItem>
                            <Label color="light">{syncIndicatorText}</Label>
                        </DetailItem>
                        {!isSubtask && (
                            <MarginLeftAuto>
                                {isInTrash && (
                                    <GTButton
                                        value="Restore Task"
                                        onClick={() =>
                                            markTaskDoneOrDeleted(
                                                { id: task.id, isDeleted: false },
                                                task.optimisticId && task.id
                                            )
                                        }
                                        styleType="secondary"
                                        size="small"
                                    />
                                )}
                                {!isMeetingPreparationTask && !isRecurringTaskTemplate && task.id_folder && (
                                    <FolderSelector
                                        value={task.id_folder}
                                        onChange={(newFolderId) =>
                                            reorderTask(
                                                {
                                                    id: task.id,
                                                    dropSectionId: newFolderId,
                                                    dragSectionId: task.id_folder,
                                                    orderingId: 1,
                                                },
                                                task.optimisticId
                                            )
                                        }
                                        renderTrigger={(isOpen, setIsOpen) => (
                                            <GTIconButton
                                                icon={icons.folder}
                                                shortcutName="moveTaskToFolder"
                                                onClick={() => setIsOpen(!isOpen)}
                                                forceShowHoverEffect={isOpen}
                                                asDiv
                                            />
                                        )}
                                        enableKeyboardShortcut
                                    />
                                )}
                                {task.deeplink && <ExternalLinkButton link={task.deeplink} />}
                                {!isRecurringTaskTemplate && <TaskActionsDropdown task={taskv4} />}
                                {isRecurringTaskTemplate && (
                                    <DeleteRecurringTaskTemplateButton template={task as TRecurringTaskTemplate} />
                                )}
                            </MarginLeftAuto>
                        )}
                    </>
                )}
            </DetailsTopContainer>
            <div>
                <GTTextField
                    type="plaintext"
                    ref={titleRef}
                    key={task.id}
                    value={isInTrash ? `${task.title} (deleted)` : task.title}
                    disabled={!!task.optimisticId || isMeetingPreparationTask || !!task.id_nux_number || isInTrash}
                    onChange={(val) => onEdit({ id: task.id, title: val, idParent: task.id_parent })}
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
                        value={task.priority_normalized ?? 0}
                        onChange={(priority) =>
                            isRecurringTaskTemplate
                                ? modifyRecurringTask({ id: task.id, priority_normalized: priority }, task.optimisticId)
                                : modifyTask({ id: task.id, priorityNormalized: priority }, task.optimisticId)
                        }
                        disabled={isInTrash}
                    />
                )}
                {!isRecurringTaskTemplate && (
                    <GTDatePicker
                        initialDate={DateTime.fromISO(task.due_date ?? '')}
                        setDate={(date) => modifyTask({ id: task.id, dueDate: date })}
                        disabled={isInTrash}
                    />
                )}
                {isRecurringTaskTemplate ? (
                    <RecurringTaskTemplateScheduleButton templateId={task.id} />
                ) : (
                    task.source?.name === 'General Task' &&
                    task.id_parent === undefined && (
                        <RecurringTaskTemplateScheduleButton
                            templateId={task.recurring_task_template_id}
                            task={taskv4}
                            folderId={task.id_folder}
                        />
                    )
                )}
                <MarginLeftAuto>
                    {!isRecurringTaskTemplate && task.external_status && task.all_statuses && (
                        <>
                            {task.source?.name === 'Linear' && (
                                <LinearStatusDropdown task={taskv4} disabled={isInTrash} />
                            )}
                            {task.source?.name === 'Jira' && <JiraStatusDropdown task={taskv4} disabled={isInTrash} />}
                        </>
                    )}
                </MarginLeftAuto>
            </TaskStatusContainer>
            {task.optimisticId ? (
                <Spinner />
            ) : (
                <>
                    {/* TODO: remove empty ObjectId check once backend stops giving us empty object ids */}
                    {!isRecurringTaskTemplate &&
                        task.recurring_task_template_id &&
                        task.recurring_task_template_id !== EMPTY_MONGO_OBJECT_ID &&
                        task.id_folder && <RecurringTaskDetailsBanner templateId={task.recurring_task_template_id} />}
                    {isRecurringTaskTemplate && task.id_task_section && (
                        <RecurringTaskTemplateDetailsBanner id={task.id} folderId={task.id_task_section} />
                    )}
                    <TaskBody
                        id={task.id}
                        body={task.body ?? ''}
                        contentType={task.source?.name === 'Jira' ? 'atlassian' : 'markdown'}
                        onChange={(val) => onEdit({ id: task.id, body: val, idParent: task.id_parent })}
                        disabled={isInTrash}
                        nux_number_id={task.id_nux_number}
                    />
                    {SOURCES_ALLOWED_WITH_SUBTASKS.includes(task.source?.name ?? '') &&
                        !isInTrash &&
                        isTaskParentTask(taskv4) && <SubtaskList parentTask={taskv4} />}
                    {task.external_status && task.source && (
                        <CommentContainer>
                            <Divider color={Colors.border.extra_light} />
                            <CommentList comments={task.comments ?? EMPTY_ARRAY} sourceName={task.source.name} />
                        </CommentContainer>
                    )}
                    {task.source?.name !== 'Jira' && task.external_status && !isInTrash && (
                        <CreateLinearComment taskId={task.id} numComments={task.comments?.length ?? 0} />
                    )}
                    {task.slack_message_params && task.sender && (
                        <SlackMessage sender={task.sender} slack_message_params={task.slack_message_params} />
                    )}
                </>
            )}
        </DetailsViewTemplate>
    )
}

export default TaskDetails
