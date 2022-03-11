import { Indices, ItemTypes, TTask, TTaskSection } from "../../utils/types";
import { RefObject, useCallback, useRef, useState } from "react";
import { Colors } from '../../styles'
import styled, { css } from "styled-components/native";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { LayoutRectangle, View } from "react-native";

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
    // const indicesRef = useRef<Indices>()
    const dropRef = useRef<View>(null)
    const overlayLayout = useRef<LayoutRectangle>()
    const taskSectionsRef = useRef<TTaskSection[]>()
    const [dropDirection, setDropDirection] = useState(DropDirection.Up)
    const [overlayHeight, setOverlayHeight] = useState<number>(0)

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
        if (item.id === task.id) return
        // if (item.indicesRef.current == null) return
        // if (taskSectionsRef.current == null) return
        if (dropRef.current == null) return
        // if (indicesRef.current == null) return
        console.log(item)
        const dropDirection = await getDropDirection(monitor.getClientOffset()?.y ?? 0)

        const dropIndex = taskIndex + 1 + (dropDirection === DropDirection.Up ? 0 : 1)
        console.log("dropped on ", dropIndex)

        // const taskSections = taskSectionsRef.current
        // const { section: dropSection } = indicesRef.current
        // const { section: dragSection, task: dragTask } = item.indicesRef.current

        // let isLowerHalf = false
        // if (boundingRect != null) {
        //     const dropMiddleY = (boundingRect.bottom - boundingRect.top) / 2 + boundingRect.top
        //     const clientOffsetY = monitor.getClientOffset()?.y
        //     isLowerHalf = !!(clientOffsetY && clientOffsetY > dropMiddleY)
        // }

        // const previousOrderingId = taskSections[dragSection].tasks[dragTask].id_ordering

        // const updatedTaskSections = taskDropReorder(
        //     taskSections,
        //     item.indicesRef.current,
        //     indicesRef.current,
        //     isLowerHalf
        // )
        // dispatch(setTasks(updatedTaskSections))

        // let updatedOrderingId = null
        // updatedOrderingId = updatedTaskSections[dropSection].tasks.find((task) => task.id === item.id)?.id_ordering
        // if (updatedOrderingId == null) return
        // if (dragSection === dropSection && updatedOrderingId < previousOrderingId) {
        //     updatedOrderingId -= 1
        // }
        // if (dragSection !== dropSection) {
        //     updatedOrderingId -= 1
        // }

        // logEvent(LogEvents.TASK_REORDERED)
        // makeAuthorizedRequest({
        //     url: TASKS_MODIFY_URL + item.id + '/',
        //     method: 'PATCH',
        //     body: JSON.stringify({
        //         id_task_section: taskSections[indices.section].id,
        //         id_ordering: updatedOrderingId + 1,
        //     }),
        // })
        //     .then(() => getTasks())
        //     .catch((error) => {
        //         throw new Error('PATCH /tasks/ failed' + error)
        //     })
    }, [])

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
    // setOverlayHeight(e.nativeEvent.layout.height)
    return <DropOverlay ref={dropRef} >
        <DropIndicatorAbove isVisible={isOver && dropDirection == DropDirection.Up} />
        {children}
        <DropIndicatorBelow isVisible={isOver && dropDirection == DropDirection.Down} />
    </DropOverlay>
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
