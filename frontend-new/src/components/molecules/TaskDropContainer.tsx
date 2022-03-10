import { Indices, ItemTypes, TTask, TTaskSection } from "../../utils/types";
import { RefObject, useCallback, useRef, useState } from "react";

import { LogEvents } from "../../utils/enums";
import { TASKS_MODIFY_URL } from "../../constants";
import { setTasks } from "../../redux/tasksPageSlice";
import styled from "styled-components/native";
import { useDrop } from "react-dnd";

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
    const dropRef = useRef<HTMLDivElement>(null)
    const taskSectionsRef = useRef<TTaskSection[]>()
    const [dropDirection, setDropDirection] = useState(DropDirection.Up)

    const drop = useCallback((item: { id: string; indicesRef: RefObject<Indices> }, monitor) => {
        if (item.id === task.id) return
        if (item.indicesRef.current == null) return
        if (taskSectionsRef.current == null) return
        if (dropRef.current == null) return
        if (indicesRef.current == null) return

        const taskSections = taskSectionsRef.current
        const { section: dropSection } = indicesRef.current
        const { section: dragSection, task: dragTask } = item.indicesRef.current

        const boundingRect = dropRef.current.getBoundingClientRect()
        let isLowerHalf = false
        if (boundingRect != null) {
            const dropMiddleY = (boundingRect.bottom - boundingRect.top) / 2 + boundingRect.top
            const clientOffsetY = monitor.getClientOffset()?.y
            isLowerHalf = !!(clientOffsetY && clientOffsetY > dropMiddleY)
        }

        const previousOrderingId = taskSections[dragSection].tasks[dragTask].id_ordering

        const updatedTaskSections = taskDropReorder(
            taskSections,
            item.indicesRef.current,
            indicesRef.current,
            isLowerHalf
        )
        dispatch(setTasks(updatedTaskSections))

        let updatedOrderingId = null
        updatedOrderingId = updatedTaskSections[dropSection].tasks.find((task) => task.id === item.id)?.id_ordering
        if (updatedOrderingId == null) return
        if (dragSection === dropSection && updatedOrderingId < previousOrderingId) {
            updatedOrderingId -= 1
        }
        if (dragSection !== dropSection) {
            updatedOrderingId -= 1
        }

        logEvent(LogEvents.TASK_REORDERED)
        makeAuthorizedRequest({
            url: TASKS_MODIFY_URL + item.id + '/',
            method: 'PATCH',
            body: JSON.stringify({
                id_task_section: taskSections[indices.section].id,
                id_ordering: updatedOrderingId + 1,
            }),
        })
            .then(() => getTasks())
            .catch((error) => {
                throw new Error('PATCH /tasks/ failed' + error)
            })
    }, [])

    useDrop(() => ({
        accept: ItemTypes.TASK,
        collect: (monitor) => {
            return { isOver: monitor.isOver() }
        },
        drop,
    }))

    return <DropOverlay>
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

export default TaskDropContainer
