import { Indices, ItemTypes, TTask, TTaskSection } from "../../utils/types";
import { RefObject, useCallback, useRef, useState } from "react";
import { Colors } from '../../styles'
import styled, { css } from "styled-components/native";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { LayoutRectangle, View } from "react-native";
import { useReorderTaskMutation } from "../../services/generalTaskApi";

interface TaskDropContainerProps {
    children: React.ReactNode
    task: TTask
    taskIndex: number
    sectionId: string
}
interface DropProps {
    id: string
    taskIndex: number
    sectionId: number
}
enum DropDirection {
    Up,
    Down,
}

// function getDropDirection()

const TaskDropContainer: React.FC<TaskDropContainerProps> = ({ task, children, taskIndex, sectionId }: TaskDropContainerProps) => {
    const dropRef = useRef<View>(null)
    const [dropDirection, setDropDirection] = useState(DropDirection.Up)

    const [reorderTask] = useReorderTaskMutation()

    const getDropDirection = useCallback((dropY: number): Promise<DropDirection> => {
        return new Promise((resolve) => {
            dropRef.current?.measureInWindow(
                (_overlayX, overlayY, _overlayWidth, overlayHeight) => {
                    const midpoint = overlayY + overlayHeight / 2
                    const dropDirection = dropY < midpoint ? DropDirection.Up : DropDirection.Down
                    setDropDirection(dropDirection)
                    resolve(dropDirection)
                })
        })
    }, [])

    const onDrop = useCallback(async (item: DropProps, monitor: DropTargetMonitor) => {
        if (item.id === task.id || dropRef.current == null) return
        const dropDirection = await getDropDirection(monitor.getClientOffset()?.y ?? 0)

        const dropIndex = taskIndex + (dropDirection === DropDirection.Up ? 1 : 2)
        console.log("dropped ", item.id, " on ", dropIndex)

        reorderTask({
            id: item.id,
            id_ordering: dropIndex,
            id_task_section: sectionId,
        })
    }, [task.id, taskIndex, sectionId])

    const [isOver, drop] = useDrop(() => ({
        accept: ItemTypes.TASK,
        collect: (monitor) => {
            return !!monitor.isOver()
        },
        drop: onDrop,
        hover: (_, monitor) => {
            getDropDirection(monitor.getClientOffset()?.y ?? 0)
        }
    }))
    drop(dropRef)

    return (
        <DropOverlay ref={dropRef} >
            <DropIndicatorAbove isVisible={isOver && dropDirection == DropDirection.Up} />
            {children}
            <DropIndicatorBelow isVisible={isOver && dropDirection == DropDirection.Down} />
        </DropOverlay>
    )
}

const DropOverlay = styled.View`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 10px 0;
`
const DropIndicatorStyles = css<{ isVisible: boolean }>`
    flex-grow: 1;
    height: 2px;
    width: 100%;
    /* position: absolute; */
    /* left: 0px; */
    /* right: 0px; */
    /* color: ${Colors.gray._300}; */
    /* border-width: 2px; */
    /* border-color: ${Colors.gray._300}; */
    background-color: ${Colors.gray._300};
    visibility: ${(props) => (props.isVisible ? 'visible' : 'hidden')};
`
export const DropIndicatorAbove = styled.View`
    ${DropIndicatorStyles}
    margin-top: -5px;
`
export const DropIndicatorBelow = styled.View`
    ${DropIndicatorStyles}
    margin-top: 5.0px;
`

export default TaskDropContainer
