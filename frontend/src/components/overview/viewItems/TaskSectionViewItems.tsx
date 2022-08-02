import React, { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useMarkTaskDone } from '../../../services/api/overview.hooks'
import { useReorderTask } from '../../../services/api/overview.hooks'
import { DropItem, DropType, TTask } from '../../../utils/types'
import ReorderDropContainer from '../../atoms/ReorderDropContainer'
import CreateNewTask from '../../molecules/CreateNewTask'
import Task from '../../molecules/Task'
import { ViewItemsProps } from './viewItems.types'
import { TASK_HEIGHT } from '../../../styles/dimensions'

const EmptyDropContainer = styled.div`
    height: ${TASK_HEIGHT};
    display: flex;
    align-items: center;
    justify-content: center;
`

const TaskSectionViewItems = ({ view, visibleItemsCount }: ViewItemsProps) => {
    const { task_section_id: sectionId } = view
    const { mutate: markTaskDone } = useMarkTaskDone()
    const { overviewItem } = useParams()
    const { mutate: reorderTask } = useReorderTask()

    const handleReorderTask = useCallback(
        (item: DropItem, dropIndex: number) => {
            if (!view.task_section_id) return
            reorderTask({
                taskId: item.id,
                orderingId: dropIndex,
                dropSectionId: view.task_section_id,
                dragSectionId: item.sectionId,
            })
        },
        [view.task_section_id]
    )

    const handleMarkTaskComplete = useCallback(
        (taskId: string, isComplete: boolean) => {
            if (!view.task_section_id) return
            markTaskDone({ taskId, sectionId: view.task_section_id, isCompleted: isComplete })
        },
        [view.task_section_id, markTaskDone]
    )

    return (
        <>
            {sectionId && <CreateNewTask disableKeyboardShortcut sectionId={sectionId} />}
            {view.view_items.slice(0, visibleItemsCount).map((item, index) => (
                    <ReorderDropContainer
                        key={item.id}
                        index={index}
                        acceptDropType={DropType.TASK}
                        onReorder={handleReorderTask}
                    >
                        <Task
                            task={item as TTask}
                            dragDisabled={false}
                            index={index}
                            sectionId={sectionId}
                            isSelected={overviewItem === item.id}
                            link={`/overview/${item.id}`}
                            onMarkComplete={handleMarkTaskComplete}
                        />
                    </ReorderDropContainer>
                ))
            ) : (
                <ReorderDropContainer
                    index={0}
                    acceptDropType={DropType.TASK}
                    onReorder={handleReorderTask}
                    indicatorType="WHOLE"
                >
                    <EmptyDropContainer>No tasks</EmptyDropContainer>
                </ReorderDropContainer>
            )}
        </>
    )
}

export default TaskSectionViewItems
