import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { DONE_SECTION_ID, SINGLE_SECOND_INTERVAL, TASK_PRIORITIES, TRASH_SECTION_ID } from '../../constants'
import { useInterval, useKeyboardShortcut, usePreviewMode } from '../../hooks'
import Log from '../../services/api/log'
import { useMarkTaskDoneOrDeleted } from '../../services/api/tasks.hooks'
import { Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { DropType, TTask } from '../../utils/types'
import Domino from '../atoms/Domino'
import DueDate from '../atoms/DueDate'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import { MeetingStartText } from '../atoms/MeetingStartText'
import TaskTemplate from '../atoms/TaskTemplate'
import GTButton from '../atoms/buttons/GTButton'
import MarkTaskDoneButton from '../atoms/buttons/MarkTaskDoneButton'
import { Mini } from '../atoms/typography/Typography'
import { useCalendarContext } from '../calendar/CalendarContext'
import JiraPriorityDropdown from '../radix/JiraPriorityDropdown'
import StatusDropdown from '../radix/StatusDropdown'
import TaskContextMenuWrapper from '../radix/TaskContextMenuWrapper'
import Tip from '../radix/Tip'
import ItemContainer from './ItemContainer'
import { useGetRecurringTaskTemplateFromId } from './recurring-tasks/recurringTasks.utils'

const MarginRight = styled.div`
    margin-right: ${Spacing._8};
`
export const GTButtonHack = styled(GTButton)`
    width: 20px !important;
    padding: ${Spacing._4} !important;
    box-sizing: border-box;
    max-width: 20px;
`
const RightContainer = styled.span`
    display: flex;
    align-items: center;
    gap: ${Spacing._12};
    margin-left: auto;
    min-width: fit-content;
`
const Title = styled.span`
    margin-left: ${Spacing._8};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    ${Typography.bodySmall};
    padding-right: ${Spacing._8};
`
export const PositionedDomino = styled(Domino)`
    margin-right: ${Spacing._8};
`

interface TaskProps {
    task: TTask
    dragDisabled?: boolean
    dropType?: DropType
    index?: number
    sectionId?: string
    sectionScrollingRef?: MutableRefObject<HTMLDivElement | null>
    isSelected: boolean
    link: string
    meetingPreparationStartTime?: DateTime
    shouldScrollToTask?: boolean
    setShouldScrollToTask?: (shouldScrollToTask: boolean) => void
    onMarkTaskDone?: (id: string) => void
}

const Task = ({
    task,
    dragDisabled,
    dropType = DropType.TASK,
    index,
    sectionId,
    sectionScrollingRef,
    isSelected,
    link,
    shouldScrollToTask,
    setShouldScrollToTask,
    onMarkTaskDone,
}: TaskProps) => {
    const navigate = useNavigate()
    const observer = useRef<IntersectionObserver>()
    const isScrolling = useRef<boolean>(false)
    const [isHovered, setIsHovered] = useState(false)
    const [meetingStartText, setMeetingStartText] = useState<string | null>(null)
    const [isMeetingTextColored, setIsMeetingTextColor] = useState<boolean>(false)
    const { meeting_preparation_params } = task
    const dateTimeStart = DateTime.fromISO(task.meeting_preparation_params?.datetime_start || '')
    const dateTimeEnd = DateTime.fromISO(meeting_preparation_params?.datetime_end || '')
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()
    const { calendarType, setCalendarType, setDate, dayViewDate } = useCalendarContext()

    useInterval(() => {
        if (!meeting_preparation_params) return
        const minutesToStart = Math.ceil(dateTimeStart.diffNow('minutes').minutes)
        const minutesToEnd = Math.ceil(dateTimeEnd.diffNow('minutes').minutes)

        if (minutesToStart < 0 && minutesToEnd > 0) {
            setMeetingStartText('Meeting is now')
            setIsMeetingTextColor(true)
        } else if (minutesToStart < 0 && minutesToEnd < 0) {
            setMeetingStartText(null)
        } else if (minutesToStart <= 30) {
            const minutesToStartText = minutesToStart === 1 ? 'minute' : 'minutes'
            setMeetingStartText(`Starts in ${minutesToStart} ${minutesToStartText}`)
            setIsMeetingTextColor(true)
        } else {
            setMeetingStartText(dateTimeStart.toLocaleString(DateTime.TIME_SIMPLE))
            setIsMeetingTextColor(false)
        }
    }, SINGLE_SECOND_INTERVAL)

    // Add event listener to check if scrolling occurs in task section
    useEffect(() => {
        const setScrollTrue = () => {
            isScrolling.current = true
        }
        sectionScrollingRef?.current?.addEventListener('scroll', setScrollTrue)
        return () => {
            sectionScrollingRef?.current?.removeEventListener('scroll', setScrollTrue)
        }
    }, [])

    //If task selection changes, re-enable auto-scrolling for task section
    useEffect(() => {
        if (sectionScrollingRef?.current) {
            isScrolling.current = false
        }
    }, [isSelected])

    //Auto-scroll to task if it is selected and out of view
    const elementRef = useCallback(
        (node: HTMLDivElement) => {
            if (observer.current) observer.current.disconnect()
            observer.current = new IntersectionObserver(
                (entries) => {
                    if (shouldScrollToTask && !entries[0].isIntersecting && isSelected && !isScrolling.current) {
                        node.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                        })
                    }
                    if (setShouldScrollToTask) setShouldScrollToTask(false)
                },
                { threshold: 1.0 }
            )
            if (node) observer.current.observe(node)
        },
        [isSelected, isScrolling.current, shouldScrollToTask]
    )

    const onClick = useCallback(() => {
        navigate(link)
        Log(`task_select__${link}`)
        if (calendarType === 'week' && isSelected) {
            setCalendarType('day')
            setDate(dayViewDate)
        }
    }, [link, isSelected, dayViewDate])

    const [, drag, dragPreview] = useDrag(
        () => ({
            type: dropType,
            item: { id: task.id, sectionId, task },
            canDrag: !dragDisabled,
        }),
        [task, index, sectionId, dragDisabled]
    )

    // hide default drag preview
    useEffect(() => {
        dragPreview(getEmptyImage())
    }, [])

    const [isVisible, setIsVisible] = useState(true)
    const taskFadeOut = useCallback(() => {
        if (sectionId !== DONE_SECTION_ID) setIsVisible(task.is_done)
        onMarkTaskDone?.(task.id)
    }, [task.is_done, sectionId, onMarkTaskDone])

    const dueDate = DateTime.fromISO(task.due_date)
    const [contextMenuOpen, setContextMenuOpen] = useState(false)

    const deleteTask = useCallback(() => {
        markTaskDoneOrDeleted({ id: task.id, isDeleted: true }, task.optimisticId)
    }, [task])

    useKeyboardShortcut('deleteTask', deleteTask, !isSelected)
    const { isPreviewMode } = usePreviewMode()

    const recurringTaskTemplate = useGetRecurringTaskTemplateFromId(task.recurring_task_template_id)

    return (
        <TaskContextMenuWrapper task={task} sectionId={sectionId} onOpenChange={setContextMenuOpen}>
            <TaskTemplate
                ref={elementRef}
                isVisible={isVisible}
                onMouseLeave={() => setIsHovered(false)}
                onMouseEnter={() => setIsHovered(true)}
            >
                <ItemContainer isSelected={isSelected} onClick={onClick} ref={drag} forceHoverStyle={contextMenuOpen}>
                    <MarginRight>
                        {isPreviewMode && task.meeting_preparation_params?.event_moved_or_deleted ? (
                            <Tip content="Event has been moved or deleted">
                                <Icon icon={icons.warning} color="red" />
                            </Tip>
                        ) : (
                            <Domino isVisible={isHovered && !dragDisabled} />
                        )}
                    </MarginRight>
                    {task.external_status && task.all_statuses ? (
                        <StatusDropdown task={task} condensedTrigger />
                    ) : (
                        <MarkTaskDoneButton
                            taskId={task.id}
                            sectionId={sectionId}
                            isDone={task.is_done}
                            isSelected={isSelected}
                            isDisabled={!!task.optimisticId || sectionId === TRASH_SECTION_ID}
                            onMarkComplete={taskFadeOut}
                            optimsticId={task.optimisticId}
                        />
                    )}
                    <Title title={task.title}>{task.title}</Title>
                    <RightContainer>
                        {recurringTaskTemplate && <Icon icon={icons.arrows_repeat} />}
                        <DueDate date={dueDate} isDoneOrDeleted={task.is_done || task.is_deleted} />
                        {task.priority && task.all_priorities && (
                            <JiraPriorityDropdown
                                taskId={task.id}
                                currentPriority={task.priority}
                                allPriorities={task.all_priorities}
                            />
                        )}
                        {task.source?.name !== 'Jira' &&
                            task.priority_normalized !== 0 &&
                            Number.isInteger(task.priority_normalized) && (
                                <Icon
                                    icon={TASK_PRIORITIES[task.priority_normalized].icon}
                                    color={TASK_PRIORITIES[task.priority_normalized].color}
                                />
                            )}
                        {task.sub_tasks && task.sub_tasks.length > 0 && (
                            <Flex gap={Spacing._4}>
                                <Icon icon={icons.subtask} />
                                <Mini>{task.sub_tasks.length}</Mini>
                            </Flex>
                        )}
                        {meetingStartText ? (
                            <MeetingStartText isTextColored={isMeetingTextColored}>{meetingStartText}</MeetingStartText>
                        ) : (
                            <Icon icon={logos[task.source.logo_v2]} />
                        )}
                    </RightContainer>
                </ItemContainer>
            </TaskTemplate>
        </TaskContextMenuWrapper>
    )
}

export default Task
