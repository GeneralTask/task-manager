import React, { MutableRefObject, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spacing, Typography } from '../../styles'
import { DropType, TTask } from '../../utils/types'

import { useDrag } from 'react-dnd'
import styled from 'styled-components'
import { logos } from '../../styles/images'
import CompleteButton from '../atoms/buttons/CompleteButton'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'
import TaskTemplate from '../atoms/TaskTemplate'
import ItemContainer from './ItemContainer'

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
    onMarkComplete: (taskId: string, isComplete: boolean) => void
    allowSelect?: boolean
}

const Task = ({
    task,
    dragDisabled,
    index,
    sectionId,
    isSelected,
    link,
    onMarkComplete,
    allowSelect = true,
}: TaskProps) => {
    const navigate = useNavigate()
    const [isHovered, setIsHovered] = useState(false)
    const onClick = useCallback(() => {
        if (allowSelect) {
            navigate(link)
        }
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

    return (
        <TaskTemplate onMouseLeave={() => setIsHovered(false)} onMouseEnter={() => setIsHovered(true)}>
            <ItemContainer
                isSelected={isSelected}
                isHovered={isHovered}
                allowSelect={allowSelect}
                onClick={onClick}
                ref={dragPreview}
            >
                {((isSelected && allowSelect) || isHovered) && !dragDisabled && (
                    <DominoContainer>
                        <Domino ref={drag} />
                    </DominoContainer>
                )}
                <CompleteButton
                    taskId={task.id}
                    isComplete={task.is_done}
                    onMarkComplete={onMarkComplete}
                    isSelected={isSelected}
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
