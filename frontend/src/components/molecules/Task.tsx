import { MutableRefObject, memo, useCallback, useEffect, useRef, useState } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { DONE_FOLDER_ID, SINGLE_SECOND_INTERVAL, TASK_PRIORITIES } from '../../constants'
import { useInterval } from '../../hooks'
import { useModifyTask } from '../../services/api/tasks.hooks'
import { Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { DropType, TTask } from '../../utils/types'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'
import { MeetingStartText } from '../atoms/MeetingStartText'
import TaskTemplate from '../atoms/TaskTemplate'
import GTButton from '../atoms/buttons/GTButton'
import MarkTaskDoneButton from '../atoms/buttons/MarkTaskDoneButton'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import TaskContextMenuWrapper from '../radix/TaskContextMenuWrapper'
import GTDatePicker from './GTDatePicker'
import ItemContainer from './ItemContainer'

const RightContainer = styled.span`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
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
const DominoContainer = styled.div<{ isVisible: boolean }>`
    opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
`

interface TaskProps {
    task: TTask
    dragDisabled: boolean
    index?: number
    folderId?: string
    folderScrollingRef?: MutableRefObject<HTMLDivElement | null>
    isSelected: boolean
    link: string
    meetingPreparationStartTime?: DateTime
}

const Task = ({ task, dragDisabled, index, folderId, folderScrollingRef, isSelected, link }: TaskProps) => {
    const navigate = useNavigate()
    const observer = useRef<IntersectionObserver>()
    const isScrolling = useRef<boolean>(false)
    const [isHovered, setIsHovered] = useState(false)
    const [meetingStartText, setMeetingStartText] = useState<string | null>(null)
    const [isMeetingTextColored, setIsMeetingTextColor] = useState<boolean>(false)
    const { meeting_preparation_params } = task
    const dateTimeStart = DateTime.fromISO(task.meeting_preparation_params?.datetime_start || '')

    const { mutate: modifyTask } = useModifyTask()

    useInterval(() => {
        if (!meeting_preparation_params) return
        const minutes = Math.ceil(dateTimeStart.diffNow('minutes').minutes)
        if (minutes < 0) {
            setMeetingStartText('Meeting is now')
            setIsMeetingTextColor(true)
        } else if (minutes <= 30) {
            const minutesText = minutes === 1 ? 'minute' : 'minutes'
            setMeetingStartText(`Starts in ${minutes} ${minutesText}`)
            setIsMeetingTextColor(true)
        } else {
            setMeetingStartText(dateTimeStart.toLocaleString(DateTime.TIME_SIMPLE))
            setIsMeetingTextColor(false)
        }
    }, SINGLE_SECOND_INTERVAL)

    // Add event listener to check if scrolling occurs in task folder
    useEffect(() => {
        const setScrollTrue = () => {
            isScrolling.current = true
        }
        folderScrollingRef?.current?.addEventListener('scroll', setScrollTrue)
        return () => {
            folderScrollingRef?.current?.removeEventListener('scroll', setScrollTrue)
        }
    }, [])

    //If task selection changes, re-enable auto-scrolling for task folder
    useEffect(() => {
        if (folderScrollingRef?.current) {
            isScrolling.current = false
        }
    }, [isSelected])

    //Auto-scroll to task if it is selected and out of view
    const elementRef = useCallback(
        (node: HTMLDivElement) => {
            if (observer.current) observer.current.disconnect()
            observer.current = new IntersectionObserver(
                (entries) => {
                    if (!entries[0].isIntersecting && isSelected && !isScrolling.current) {
                        node.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                        })
                    }
                },
                { threshold: 1.0 }
            )
            if (node) observer.current.observe(node)
        },
        [isSelected, isScrolling.current]
    )

    const onClick = useCallback(() => {
        navigate(link)
    }, [link])

    const [, drag, dragPreview] = useDrag(
        () => ({
            type: DropType.TASK,
            item: { id: task.id, folderId, task },
            canDrag: !dragDisabled,
            collect: (monitor) => {
                const isDragging = !!monitor.isDragging()
                return { opacity: isDragging ? 0.5 : 1 }
            },
        }),
        [task, index, folderId]
    )

    // hide default drag preview
    useEffect(() => {
        dragPreview(getEmptyImage())
    }, [])

    const [isVisible, setIsVisible] = useState(true)

    const taskFadeOut = () => {
        if (folderId !== DONE_FOLDER_ID) setIsVisible(task.is_done)
    }

    return (
        <TaskContextMenuWrapper task={task} folderId={folderId}>
            <TaskTemplate
                ref={elementRef}
                isVisible={isVisible}
                onMouseLeave={() => setIsHovered(false)}
                onMouseEnter={() => setIsHovered(true)}
            >
                <ItemContainer isSelected={isSelected} isHovered={isHovered} onClick={onClick} ref={drag}>
                    <DominoContainer isVisible={isHovered && !dragDisabled}>
                        <Domino />
                    </DominoContainer>
                    <MarkTaskDoneButton
                        taskId={task.id}
                        folderId={folderId}
                        isDone={task.is_done}
                        isSelected={isSelected}
                        isDisabled={task.isOptimistic}
                        onMarkComplete={taskFadeOut}
                    />
                    <Title data-testid="task-title">{task.title}</Title>
                    <RightContainer>
                        <GTDatePicker
                            initialDate={DateTime.fromISO(task.due_date).toJSDate()}
                            setDate={(date) => modifyTask({ id: task.id, dueDate: date })}
                            showIcon={false}
                        />
                        <GTDropdownMenu
                            items={TASK_PRIORITIES.map((priority, val) => ({
                                label: priority.label,
                                onClick: () => modifyTask({ id: task.id, priorityNormalized: val }),
                                icon: priority.icon,
                            }))}
                            trigger={
                                <GTButton
                                    icon={TASK_PRIORITIES[task.priority_normalized].icon}
                                    size="small"
                                    styleType="simple"
                                />
                            }
                        />
                        {meetingStartText ? (
                            <MeetingStartText isTextColored={isMeetingTextColored}>{meetingStartText}</MeetingStartText>
                        ) : (
                            <Icon icon={logos[task.source.logo_v2]} size="small" />
                        )}
                    </RightContainer>
                </ItemContainer>
            </TaskTemplate>
        </TaskContextMenuWrapper>
    )
}

export default memo(Task)
