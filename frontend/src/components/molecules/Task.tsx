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
import { DONE_SECTION_ID } from '../../constants'

const IconContainer = styled.div`
    margin-left: auto;
`
const Title = styled.span`
    margin-left: ${Spacing.margin._8};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    ${Typography.bodySmall};
`
const DominoContainer = styled.div`
    position: absolute;
    left: ${Spacing.margin._4};
`

interface TaskProps {
    task: TTask
    dragDisabled: boolean
    index?: number
    sectionId?: string
    sectionScrollingRef?: MutableRefObject<HTMLDivElement | null>
    isSelected: boolean
    link: string
}

const Task = ({ task, dragDisabled, index, sectionId, sectionScrollingRef, isSelected, link }: TaskProps) => {
    const navigate = useNavigate()
    const observer = useRef<IntersectionObserver>()
    const isScrolling = useRef<boolean>(false)
    const [isHovered, setIsHovered] = useState(false)

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
                <IconContainer>
                    <Icon icon={logos[task.source.logo_v2]} size="small" />
                </IconContainer>
            </ItemContainer>
        </TaskTemplate>
    )
}

export default Task
