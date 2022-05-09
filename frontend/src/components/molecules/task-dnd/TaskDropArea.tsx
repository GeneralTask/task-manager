import React, { useCallback, useEffect, useRef } from 'react'
import { useDrop } from 'react-dnd'
import styled from 'styled-components'
import { useReorderTask } from '../../../services/api-query-hooks'
import { DropProps, ItemTypes } from '../../../utils/types'
import { DropIndicatorAbove } from '../TaskDropContainer'

const TaskDropAreaContainer = styled.div`
    width: 100%;
    flex: 1;
    min-height: 100px;
`

interface TaskDropAreaProps {
    dropIndex: number
    taskSectionId: string
}

const TaskDropArea = ({ dropIndex, taskSectionId }: TaskDropAreaProps) => {
    const dropRef = useRef<HTMLDivElement>(null)
    const { mutate: reorderTask } = useReorderTask()

    const onDrop = useCallback(
        (item: DropProps) => {
            reorderTask({
                taskId: item.id,
                orderingId: dropIndex,
                dropSectionId: taskSectionId,
            })
        },
        [dropIndex, taskSectionId]
    )

    const [isOver, drop] = useDrop(
        () => ({
            accept: ItemTypes.TASK,
            collect: (monitor) => {
                return !!monitor.isOver()
            },
            drop: onDrop,
        }),
        [onDrop]
    )

    useEffect(() => {
        drop(dropRef)
    }, [dropRef])

    return (
        <TaskDropAreaContainer ref={dropRef} data-testid="task-drop-area">
            <DropIndicatorAbove isVisible={isOver} />
        </TaskDropAreaContainer>
    )
}

export default TaskDropArea
