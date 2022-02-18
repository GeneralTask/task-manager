import './Task.css'

import { DraggableContainer, DropIndicatorAbove, DropIndicatorBelow, TaskContainer } from './Task-style'
import { Indices, ItemTypes } from '../../helpers/types'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'

import React, { useCallback } from 'react'
import { TTask } from '../../helpers/types'
import TaskBody from './TaskBody'
import TaskHeader from './header/Header'
import { useClickOutside } from '../../helpers/utils'
import { useDrag } from 'react-dnd'
import { setSelectionInfo } from '../../redux/tasksPageSlice'

interface Props {
    task: TTask
    dragDisabled: boolean
    isOver: boolean
    dropDirection: boolean
    indices: Indices
}

export default function Task(props: Props): JSX.Element {
    const dispatch = useAppDispatch()
    const { task, dragDisabled, isOver, dropDirection } = props
    const isSelected = useAppSelector((state) => state.tasks_page.tasks.selection_info.id === task.id)
    const isBodyExpanded = useAppSelector(
        (state) => isSelected && state.tasks_page.tasks.selection_info.is_body_expanded
    )

    const indicesRef = React.useRef<Indices>()
    indicesRef.current = props.indices

    const [{ opacity }, drag, dragPreview] = useDrag(() => ({
        type: ItemTypes.TASK,
        item: { id: task.id, indicesRef: indicesRef },
        collect: (monitor) => {
            const isDragging = !!monitor.isDragging()
            return { opacity: isDragging ? 0.5 : 1 }
        },
    }))

    const containerRef = React.useRef<HTMLDivElement>(null)
    useClickOutside(containerRef, () => {
        isBodyExpanded && dispatch(setSelectionInfo({ is_body_expanded: false }))
    })

    const selectTask = useCallback(() => {
        dispatch(setSelectionInfo({ id: task.id }))
    }, [task.id])

    return (
        <DraggableContainer ref={dragPreview}>
            {isSelected && <div>selected</div>}
            <DropIndicatorAbove isVisible={isOver && dropDirection} />
            <TaskContainer opacity={opacity} isExpanded={isBodyExpanded} ref={containerRef} onClick={selectTask}>
                <TaskHeader task={task} dragDisabled={dragDisabled} isExpanded={isBodyExpanded} ref={drag} />
                <TaskBody task={task} isExpanded={isBodyExpanded} />
            </TaskContainer>
            <DropIndicatorBelow isVisible={isOver && !dropDirection} />
        </DraggableContainer>
    )
}
