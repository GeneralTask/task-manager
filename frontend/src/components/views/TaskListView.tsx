import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGetTasks, useMarkTaskDone, useReorderTask } from '../../services/api/tasks.hooks'

import styled from 'styled-components'
import useItemSelectionController from '../../hooks/useItemSelectionController'
import { DropItem, DropType, TTaskSection } from '../../utils/types'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import Task from '../molecules/Task'

const TasksContainer = styled.div`
    display: flex;
    flex-direction: column;
`

interface TaskListProps {
    section: TTaskSection
    allowSelect?: boolean
}

const TaskList = ({ section, allowSelect = true }: TaskListProps) => {
    const sectionScrollingRef = useRef<HTMLDivElement | null>(null)
    const sectionViewRef = useRef<HTMLDivElement>(null)

    const { data: taskSections } = useGetTasks()
    const { mutate: reorderTask } = useReorderTask()
    const { mutate: markTaskDone } = useMarkTaskDone()

    const navigate = useNavigate()
    const params = useParams()
    const { task } = useMemo(() => {
        const task = section?.tasks.find(({ id }) => id === params.task)
        return { section, task }
    }, [taskSections, params.task, params.section])

    const selectTask = useCallback(
        (itemId: string) => {
            if (section) navigate(`/tasks/${section.id}/${itemId}`)
        },
        [section]
    )

    const handleReorderTask = useCallback(
        (item: DropItem, dropIndex: number) => {
            if (!section) return
            reorderTask({
                taskId: item.id,
                orderingId: dropIndex,
                dropSectionId: section.id,
            })
        },
        [section]
    )

    const handleMarkTaskComplete = useCallback(
        (taskId: string, isComplete: boolean) => {
            if (!section) return
            markTaskDone({ taskId, sectionId: section.id, isCompleted: isComplete })
        },
        [section, markTaskDone]
    )

    // deal with invalid routes
    useEffect(() => {
        if (taskSections && taskSections.length > 0 && (!section || !task)) {
            const firstSectionId = taskSections[0].id
            if (!section) {
                navigate(`/tasks/${firstSectionId}/`)
            } else if (!task && section.tasks.length > 0) {
                navigate(`/tasks/${section.id}/${section.tasks[0].id}`)
            }
        }
    }, [taskSections, params.section, params.task])

    useItemSelectionController(section?.tasks ?? [], selectTask)

    return (
        <>
            <TasksContainer ref={sectionViewRef} data-testid="task-list-container">
                {section.tasks.map((task, index) => (
                    <ReorderDropContainer
                        key={task.id}
                        index={index}
                        acceptDropType={DropType.TASK}
                        onReorder={handleReorderTask}
                    >
                        <Task
                            task={task}
                            dragDisabled={section.is_done}
                            index={index}
                            sectionId={section.id}
                            sectionScrollingRef={sectionScrollingRef}
                            isSelected={task.id === params.task}
                            link={`/tasks/${params.section}/${task.id}`}
                            onMarkComplete={handleMarkTaskComplete}
                            allowSelect={allowSelect}
                        />
                    </ReorderDropContainer>
                ))}
            </TasksContainer>
        </>
    )
}

export default TaskList
