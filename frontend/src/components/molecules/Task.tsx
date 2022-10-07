import { MutableRefObject, memo, useCallback, useEffect, useRef, useState } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { DONE_SECTION_ID, SINGLE_SECOND_INTERVAL, TASK_PRIORITIES } from '../../constants'
import { useInterval } from '../../hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { TTextColor } from '../../styles/colors'
import { logos } from '../../styles/images'
import { DropType, TTask } from '../../utils/types'
import { getFormattedDate, isValidDueDate } from '../../utils/utils'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'
import { MeetingStartText } from '../atoms/MeetingStartText'
import TaskTemplate from '../atoms/TaskTemplate'
import MarkTaskDoneButton from '../atoms/buttons/MarkTaskDoneButton'
import TaskContextMenuWrapper from '../radix/TaskContextMenuWrapper'
import ItemContainer from './ItemContainer'

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
const DominoContainer = styled.div<{ isVisible: boolean }>`
    opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
`
const DueDate = styled.span<{ color: TTextColor }>`
    color: ${(props) => Colors.text[props.color]};
    ${Typography.bodySmall};
`

interface TaskProps {
    task: TTask
    dragDisabled: boolean
    index?: number
    sectionId?: string
    sectionScrollingRef?: MutableRefObject<HTMLDivElement | null>
    isSelected: boolean
    link: string
    meetingPreparationStartTime?: DateTime
}

const Task = ({ task, dragDisabled, index, sectionId, sectionScrollingRef, isSelected, link }: TaskProps) => {
    const navigate = useNavigate()
    const observer = useRef<IntersectionObserver>()
    const isScrolling = useRef<boolean>(false)
    const [isHovered, setIsHovered] = useState(false)
    const [meetingStartText, setMeetingStartText] = useState<string | null>(null)
    const [isMeetingTextColored, setIsMeetingTextColor] = useState<boolean>(false)
    const { meeting_preparation_params } = task
    const dateTimeStart = DateTime.fromISO(task.meeting_preparation_params?.datetime_start || '')

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
            item: { id: task.id, sectionId, task },
            canDrag: !dragDisabled,
            collect: (monitor) => {
                const isDragging = !!monitor.isDragging()
                return { opacity: isDragging ? 0.5 : 1 }
            },
        }),
        [task, index, sectionId]
    )

    // hide default drag preview
    useEffect(() => {
        dragPreview(getEmptyImage())
    }, [])

    const [isVisible, setIsVisible] = useState(true)
    const taskFadeOut = () => {
        if (sectionId !== DONE_SECTION_ID) setIsVisible(task.is_done)
    }

    const dueDate = DateTime.fromISO(task.due_date).toJSDate()
    const formattedDate = getFormattedDate(dueDate)

    const [contextMenuOpen, setContextMenuOpen] = useState(false)

    return (
        <TaskContextMenuWrapper task={task} sectionId={sectionId} onOpenChange={setContextMenuOpen}>
            <TaskTemplate
                ref={elementRef}
                isVisible={isVisible}
                onMouseLeave={() => setIsHovered(false)}
                onMouseEnter={() => setIsHovered(true)}
            >
                <ItemContainer isSelected={isSelected} onClick={onClick} ref={drag} forceHoverStyle={contextMenuOpen}>
                    <DominoContainer isVisible={isHovered && !dragDisabled}>
                        <Domino />
                    </DominoContainer>
                    <MarkTaskDoneButton
                        taskId={task.id}
                        sectionId={sectionId}
                        isDone={task.is_done}
                        isSelected={isSelected}
                        isDisabled={task.isOptimistic}
                        onMarkComplete={taskFadeOut}
                    />
                    <Title>{task.title}</Title>
                    <RightContainer>
                        {isValidDueDate(dueDate) && (
                            <DueDate color={formattedDate.textColor}>{formattedDate.dateString}</DueDate>
                        )}
                        {task.priority_normalized !== 0 && (
                            <Icon
                                icon={TASK_PRIORITIES[task.priority_normalized].icon}
                                color={TASK_PRIORITIES[task.priority_normalized].color}
                            />
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

export default memo(Task)
