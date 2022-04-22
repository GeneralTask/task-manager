import { ItemTypes, TTask } from '../../utils/types'
import React, { MutableRefObject, useCallback, useEffect, useRef } from 'react'
import { Spacing, Typography } from '../../styles'
import { useNavigate, useParams } from 'react-router-dom'

import CompleteButton from '../atoms/buttons/CompleteButton'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'
import ItemContainer from './ItemContainer'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import TaskTemplate from '../atoms/TaskTemplate'
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
    sectionScrollingRef: MutableRefObject<HTMLDivElement | null>
}

const Task = ({ task, dragDisabled, index, sectionId, sectionScrollingRef }: TaskProps) => {
    const navigate = useNavigate()
    const params = useParams()
    const isExpanded = params.task === task.id
    const isSelected = useAppSelector((state) => isExpanded || state.tasks_page.selected_item_id === task.id)
    const observer = useRef<IntersectionObserver>()
    const selectedTask = useAppSelector((state) => state.tasks_page.selected_item_id)
    const isScrolling = useRef<Boolean>(false)

    // Add event listener to check if scrolling occurs in task section
    useEffect(() => {
        sectionScrollingRef?.current?.addEventListener('scroll', () => {
            isScrolling.current = true
        })
        return () => {
            sectionScrollingRef?.current?.removeEventListener('scroll', () => {})
        }
    }, [])

    //If task selection changes, re-enable auto-scrolling for task section
    useEffect(() => {
        if (sectionScrollingRef.current) {
            isScrolling.current = false
        }
    }, [selectedTask])

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
        <TaskTemplate ref={elementRef}>
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
