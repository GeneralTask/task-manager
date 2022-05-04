import { DropProps, ItemTypes, TTask } from '../../utils/types'
import { DropTargetMonitor, useDrop } from 'react-dnd'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'

import { Colors } from '../../styles'
import { useReorderTask } from '../../services/api-query-hooks'

const DropOverlay = styled.div`
    width: 100%;
    height: fit-content;
    display: flex;
    flex-direction: column;
    align-items: center;
`
const DropIndicatorStyles = css<{ isVisible: boolean }>`
    width: 100%;
    background-color: ${Colors.gray._800};
    visibility: ${(props) => (props.isVisible ? 'visible' : 'hidden')};
    position: relative;
    height: 2px;
`
export const DropIndicatorAbove = styled.div`
    ${DropIndicatorStyles}
`
const DropIndicatorBelow = styled.div`
    ${DropIndicatorStyles}
    top: 2px;
`

interface TaskDropContainerProps {
    children: JSX.Element
    task: TTask
    taskIndex: number
    sectionId: string
}
enum DropDirection {
    Up,
    Down,
}

const TaskDropContainer: React.FC<TaskDropContainerProps> = ({
    task,
    children,
    taskIndex,
    sectionId,
}: TaskDropContainerProps) => {
    const dropRef = useRef<HTMLDivElement>(null)
    const [dropDirection, setDropDirection] = useState(DropDirection.Up)

    const { mutate: reorderTask } = useReorderTask()

    const getDropDirection = useCallback((dropY: number): DropDirection => {
        const boundingRect = dropRef.current?.getBoundingClientRect()
        if (!boundingRect) {
            return DropDirection.Up
        }
        const midpoint = (boundingRect.top + boundingRect.bottom) / 2
        const dropDirection = dropY < midpoint ? DropDirection.Up : DropDirection.Down
        setDropDirection(dropDirection)
        return dropDirection
    }, [])

    const onDrop = useCallback(
        async (item: DropProps, monitor: DropTargetMonitor) => {
            if (item.id === task.id || dropRef.current == null) return
            const dropDirection = await getDropDirection(monitor.getClientOffset()?.y ?? 0)

            const dropIndex = taskIndex + (dropDirection === DropDirection.Up ? 1 : 2)

            reorderTask({
                taskId: item.id,
                orderingId: dropIndex,
                dropSectionId: sectionId,
            })
        },
        [task.id, taskIndex, sectionId]
    )

    const [isOver, drop] = useDrop(
        () => ({
            accept: ItemTypes.TASK,
            collect: (monitor) => {
                return !!monitor.isOver()
            },
            drop: onDrop,
            hover: (_, monitor) => {
                getDropDirection(monitor.getClientOffset()?.y ?? 0)
            },
        }),
        [task.id, taskIndex, sectionId]
    )

    useEffect(() => {
        drop(dropRef)
    }, [dropRef])

    return (
        <DropOverlay ref={dropRef}>
            <DropIndicatorAbove isVisible={isOver && dropDirection == DropDirection.Up} />
            {children}
            <DropIndicatorBelow isVisible={isOver && dropDirection == DropDirection.Down} />
        </DropOverlay>
    )
}

export default TaskDropContainer
