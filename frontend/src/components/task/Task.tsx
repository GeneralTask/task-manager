import './Task.css'

import { TaskContainer, DraggableContainer, DropIndicatorAbove, DropIndicatorBelow } from './Task-style'
import { Indices, ItemTypes } from '../../helpers/types'

import React from 'react'
import { TTask } from '../../helpers/types'
import TaskBody from './TaskBody'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { useDrag } from 'react-dnd'
import TaskHeader from './header/Header'
import { useClickOutside } from '../../helpers/utils'
import { collapseBody } from '../../redux/tasksPageSlice'

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
    const { isBodyExpanded } = useAppSelector((state) => ({
        isBodyExpanded: state.tasks_page.tasks.expanded_body === task.id,
    }))
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
        isBodyExpanded && dispatch(collapseBody())
    })

    return (
        <DraggableContainer ref={dragPreview}>
            <DropIndicatorAbove isVisible={isOver && dropDirection} />
            <TaskContainer opacity={opacity} isExpanded={isBodyExpanded} ref={containerRef}>
                <TaskHeader task={task} dragDisabled={dragDisabled} isExpanded={isBodyExpanded} ref={drag} />
                <TaskBody task={task} isExpanded={isBodyExpanded} />
            </TaskContainer>
            <DropIndicatorBelow isVisible={isOver && !dropDirection} />
        </DraggableContainer>
    )
}
