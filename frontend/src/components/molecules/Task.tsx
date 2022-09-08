import { DropType, TTask } from '../../utils/types'
import React, { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react'
import { Spacing, Typography } from '../../styles'
import { useNavigate } from 'react-router-dom'

import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'
import ItemContainer from './ItemContainer'
import TaskTemplate from '../atoms/TaskTemplate'
import { logos } from '../../styles/images'
import styled from 'styled-components'
import { useDrag } from 'react-dnd'
import MarkTaskDoneButton from '../atoms/buttons/MarkTaskDoneButton'
import { DONE_SECTION_ID, SINGLE_SECOND_INTERVAL } from '../../constants'
import { DateTime } from 'luxon'
import { MeetingStartText } from '../atoms/MeetingStartText'
import { useInterval } from '../../hooks'

const RightContainer = styled.span`
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
const DominoContainer = styled.div`
    position: absolute;
    left: 2px;
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
            setMeetingStartText(`Starts in ${minutes} minutes`)
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
        (node) => {
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
            collect: (monitor) => {
                const isDragging = !!monitor.isDragging()
                return { opacity: isDragging ? 0.5 : 1 }
            },
        }),
        [task.id, index, sectionId]
    )

    const [isVisible, setIsVisible] = useState(true)

    const taskFadeOut = () => {
        if (sectionId !== DONE_SECTION_ID) setIsVisible(task.is_done)
    }

    return (
        <TaskTemplate
            ref={elementRef}
            isVisible={isVisible}
            onMouseLeave={() => setIsHovered(false)}
            onMouseEnter={() => setIsHovered(true)}
        >
            <ItemContainer isSelected={isSelected} isHovered={isHovered} onClick={onClick} ref={dragPreview}>
                {isHovered && !dragDisabled && (
                    <DominoContainer>
                        <Domino ref={drag} />
                    </DominoContainer>
                )}
                <MarkTaskDoneButton
                    taskId={task.id}
                    sectionId={sectionId}
                    isDone={task.is_done}
                    isSelected={isSelected}
                    isDisabled={task.isOptimistic}
                    onMarkComplete={taskFadeOut}
                />
                <Title data-testid="task-title">{task.title}</Title>
                <RightContainer>
                    {meetingStartText ? (
                        <MeetingStartText isTextColored={isMeetingTextColored}>{meetingStartText}</MeetingStartText>
                    ) : (
                        <Icon icon={logos[task.source.logo_v2]} size="small" />
                    )}
                </RightContainer>
            </ItemContainer>
        </TaskTemplate>
    )
}

export default Task
