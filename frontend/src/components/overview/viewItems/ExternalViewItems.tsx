import React, { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useMarkTaskDone } from '../../../services/api/overview.hooks'
import { TTask } from '../../../utils/types'
import Task from '../../molecules/Task'
import { ViewItemsProps } from './viewItems.types'
import { useGTQueryClient } from '../../../services/queryUtils'

const ExternalViewItems = ({ view, visibleItemsCount }: ViewItemsProps) => {
    const { overviewItem } = useParams()
    const { mutate: markTaskDone } = useMarkTaskDone()
    const queryClient = useGTQueryClient()

    const handleMarkTaskComplete = useCallback(
        (taskId: string, isComplete: boolean) => {
            if (queryClient.isMutating({ mutationKey: 'markTaskDone' })) return
            markTaskDone({ taskId, isCompleted: isComplete })
        },
        [markTaskDone]
    )

    return (
        <>
            {view.view_items.slice(0, visibleItemsCount).map((item) => (
                <Task
                    key={item.id}
                    task={item as TTask}
                    dragDisabled={true}
                    isSelected={overviewItem === item.id}
                    link={`/overview/${item.id}`}
                    onMarkComplete={handleMarkTaskComplete}
                />
            ))}
        </>
    )
}

export default ExternalViewItems
