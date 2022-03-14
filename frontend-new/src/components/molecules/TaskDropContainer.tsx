import { DropTargetMonitor, useDrop } from 'react-dnd'
import { ItemTypes, TTask } from '../../utils/types'
import styled, { css } from 'styled-components/native'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Colors } from '../../styles'
import { View } from 'react-native'
import { useReorderTaskMutation } from '../../services/generalTaskApi'

interface TaskDropContainerProps {
    children: JSX.Element
    task: TTask
    taskIndex: number
    sectionId: string
}
interface DropProps {
    id: string
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
    const dropRef = useRef<View>(null)
    const [dropDirection, setDropDirection] = useState(DropDirection.Up)

    const [reorderTask] = useReorderTaskMutation()

    const getDropDirection = useCallback((dropY: number): Promise<DropDirection> => {
        return new Promise((resolve) => {
            dropRef.current?.measureInWindow((_overlayX, overlayY, _overlayWidth, overlayHeight) => {
                const midpoint = overlayY + overlayHeight / 2
                const dropDirection = dropY < midpoint ? DropDirection.Up : DropDirection.Down
                setDropDirection(dropDirection)
                resolve(dropDirection)
            })
        })
    }, [])

    const onDrop = useCallback(
        async (item: DropProps, monitor: DropTargetMonitor) => {
            if (item.id === task.id || dropRef.current == null) return
            const dropDirection = await getDropDirection(monitor.getClientOffset()?.y ?? 0)

            const dropIndex = taskIndex + (dropDirection === DropDirection.Up ? 1 : 2)

            console.log({
                taskId: item.id,
                orderingId: dropIndex,
                dropSectionId: sectionId,
            })

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
    }, [])

    return (
        <DropOverlay ref={dropRef}>
            <DropIndicatorAbove isVisible={isOver && dropDirection == DropDirection.Up} />
            {children}
            <DropIndicatorBelow isVisible={isOver && dropDirection == DropDirection.Down} />
        </DropOverlay>
    )
}

const DropOverlay = styled.View`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
`
const DropIndicatorStyles = css<{ isVisible: boolean }>`
    height: 2px;
    width: 100%;
    background-color: ${Colors.gray._300};
    visibility: ${(props) => (props.isVisible ? 'visible' : 'hidden')};
`
export const DropIndicatorAbove = styled.View`
    ${DropIndicatorStyles}
    top: 1px;
`
export const DropIndicatorBelow = styled.View`
    ${DropIndicatorStyles}
    top: -1px;
`

export default TaskDropContainer
