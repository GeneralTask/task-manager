import React, { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useMarkTaskDone } from '../../../services/api/overview.hooks'
import { DropType, TTask } from '../../../utils/types'
import { emptyFunction } from '../../../utils/utils'
import ReorderDropContainer from '../../atoms/ReorderDropContainer'
import Task from '../../molecules/Task'
import { ViewItemsProps } from './viewItems.types'

const TaskSectionViewItems = ({ view, visibleItemsCount }: ViewItemsProps) => {
    const { task_section_id: sectionId } = view
    const { mutate: markTaskDone } = useMarkTaskDone()
    const { overviewItem } = useParams()

    const handleMarkTaskComplete = useCallback(
        (taskId: string, isComplete: boolean) => {
            if (!view.task_section_id) return
            markTaskDone({ taskId, sectionId: view.task_section_id, isCompleted: isComplete })
        },
        [view.task_section_id, markTaskDone]
    )

    return (
        <>
            {view.view_items.slice(0, visibleItemsCount).map((item, index) => (
                <ReorderDropContainer
                    key={item.id}
                    index={index}
                    acceptDropType={DropType.TASK}
                    onReorder={emptyFunction} // TODO: add reordering
                >
                    <Task
                        task={item as TTask}
                        dragDisabled={true}
                        index={index}
                        sectionId={sectionId}
                        isSelected={overviewItem === item.id}
                        link={`/overview/${item.id}`}
                        onMarkComplete={handleMarkTaskComplete}
                    />
                </ReorderDropContainer>
            ))}
        </>
    )
}

export default TaskSectionViewItems
