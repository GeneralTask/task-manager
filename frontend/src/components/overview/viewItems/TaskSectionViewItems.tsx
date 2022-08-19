import React, { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useReorderTask } from '../../../services/api/tasks.hooks'
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

const TaskSectionViewItems = ({ view, visibleItemsCount, scrollRef }: ViewItemsProps) => {
    const { task_section_id: sectionId } = view
    const { mutate: markTaskDone } = useMarkTaskDone()
    const { overviewViewId, overviewItemId } = useParams()
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

    return (
        <>
            {sectionId && <CreateNewTask disableKeyboardShortcut sectionId={sectionId} />}
            {view.view_items.length > 0 ? (
                view.view_items.slice(0, visibleItemsCount).map((item, index) => (
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
                            sectionScrollingRef={scrollRef}
                            isSelected={overviewViewId === view.id && overviewItemId === item.id}
                            link={`/overview/${view.id}/${item.id}`}
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
