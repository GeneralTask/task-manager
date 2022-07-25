import React, { useCallback, useRef } from 'react'
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

    // TODO: either change Task to make this optional or add better support for scrolling. Unused for now.
    const scrollingRef = useRef<HTMLDivElement>(null)

    const handleMarkTaskComplete = useCallback(
        (taskId: string, isComplete: boolean) => {
            if (!view.task_section_id) return
            markTaskDone({ taskId, sectionId: view.task_section_id, isCompleted: isComplete })
        },
        [view.task_section_id, markTaskDone]
    )

    return (
        <div ref={scrollingRef}>
            {sectionId &&
                view.view_items.slice(0, visibleItemsCount).map((item, index) => (
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
                            sectionScrollingRef={scrollingRef}
                            isSelected={overviewItem === item.id}
                            link={`/overview/${item.id}`}
                            onMarkComplete={handleMarkTaskComplete}
                        />
                    </ReorderDropContainer>
                ))}
        </div>
    )
}

export default TaskSectionViewItems
