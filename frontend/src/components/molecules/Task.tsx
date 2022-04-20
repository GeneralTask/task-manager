import { ItemTypes, TTask } from '../../utils/types'
import React, { useCallback } from 'react'
import { Spacing, Typography } from '../../styles'
import { useNavigate, useParams } from 'react-router-dom'

import CompleteButton from '../atoms/buttons/CompleteButton'
import { Icon, Domino, TaskTemplate } from '@atoms'
import ItemContainer from './ItemContainer'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import { logos } from '../../styles/images'
import styled from 'styled-components'
import { useAppSelector } from '../../redux/hooks'
import { useDrag } from 'react-dnd'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'

const IconContainer = styled.div`
    margin-left: ${Spacing.margin._8}px;
`
const Title = styled.div`
    margin-left: ${Spacing.margin._8}px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: Switzer-Variable;
    font-size: ${Typography.xSmall.fontSize};
`

interface TaskProps {
    task: TTask
    dragDisabled: boolean
    index: number
    sectionId: string
}

const Task = ({ task, dragDisabled, index, sectionId }: TaskProps) => {
    const navigate = useNavigate()
    const params = useParams()
    const isExpanded = params.task === task.id
    const isSelected = useAppSelector((state) => isExpanded || state.tasks_page.selected_item_id === task.id)

    const hideDetailsView = useCallback(() => navigate(`/tasks/${params.section}`), [params])

    const onClick = useCallback(() => {
        if (params.task === task.id) {
            hideDetailsView()
        } else {
            navigate(`/tasks/${params.section}/${task.id}`)
        }
    }, [params, task])

    const [, drag, dragPreview] = useDrag(
        () => ({
            type: ItemTypes.TASK,
            item: { id: task.id, taskIndex: index, sectionId },
            collect: (monitor) => {
                const isDragging = !!monitor.isDragging()
                return { opacity: isDragging ? 0.5 : 1 }
            },
        }),
        [task.id, index, sectionId]
    )

    useKeyboardShortcut(KEYBOARD_SHORTCUTS.CLOSE, hideDetailsView, !isExpanded)
    useKeyboardShortcut(KEYBOARD_SHORTCUTS.SELECT, onClick, !isSelected)

    return (
        <TaskTemplate>
            <ItemContainer isSelected={isSelected} onClick={onClick} ref={dragPreview}>
                {!dragDisabled && <Domino ref={drag} />}
                <CompleteButton taskId={task.id} isComplete={task.is_done} isSelected={isSelected} />
                <IconContainer>
                    <Icon source={logos[task.source.logo_v2]} size="small" />
                </IconContainer>
                <Title>{task.title}</Title>
            </ItemContainer>
        </TaskTemplate>
    )
}

export default Task
