import { Indices, ItemTypes, TTask, TTaskSection } from "../../utils/types";
import { RefObject, useCallback, useRef, useState } from "react";
import { Colors } from '../../styles'
import styled, { css } from "styled-components/native";
import { useDrop } from "react-dnd";
import { View } from "react-native";

interface TaskDropContainerProps {
    children: React.ReactNode
    task: TTask
}

enum DropDirection {
    Up,
    Down,
}

const TaskDropContainer: React.FC<TaskDropContainerProps> = ({ task, children }: TaskDropContainerProps) => {
    const indicesRef = useRef<Indices>()
    const dropRef = useRef<View>(null)
    const taskSectionsRef = useRef<TTaskSection[]>()
    // const [dropDirection, setDropDirection] = useState(DropDirection.Up)
    const [overlayHeight, setOverlayHeight] = useState<number>(0)

    const onDrop = useCallback((item: { id: string; indicesRef: RefObject<Indices> }, monitor) => {
        if (item.id === task.id) return
        if (item.indicesRef.current == null) return
        if (taskSectionsRef.current == null) return
        if (dropRef.current == null) return
        if (indicesRef.current == null) return

        const taskSections = taskSectionsRef.current
        const { section: dropSection } = indicesRef.current
        const { section: dragSection, task: dragTask } = item.indicesRef.current

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
            console.log({ isOver: monitor.isOver() })
            return !!monitor.isOver()
        },
        drop: onDrop,
        hover: (_, monitor) => {
            console.log("hoveringgg")
        }
    }))
    drop(dropRef)
    // setOverlayHeight(e.nativeEvent.layout.height)
    // onLayout={(e) => console.log(e.nativeEvent.layout)}
    return <DropOverlay ref={dropRef} >
        <DropIndicatorAbove isVisible={isOver} />
        {children}
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
    /* visibility: ${(props) => (props.isVisible ? 'visible' : 'hidden')}; */
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
