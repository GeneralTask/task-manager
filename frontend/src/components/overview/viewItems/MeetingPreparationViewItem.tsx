import React from 'react'
import { useParams } from 'react-router-dom'
import { TTask } from '../../../utils/types'
import Task from '../../molecules/Task'
import { ViewItemsProps } from './viewItems.types'

const MeetingPreparationViewItem = ({ view }: ViewItemsProps) => {
    const { overviewViewId, overviewItemId } = useParams()
    return (
        <>
            {view.view_items.length > 0 ? (
                view.view_items.map((item, index) => (
                    <Task
                        task={item as TTask}
                        dragDisabled={true}
                        index={index}
                        isSelected={overviewViewId === view.id && overviewItemId === item.id}
                        link={`/overview/${view.id}/${item.id}`}
                    />
                ))
            ) : (
                <div>oopsie no tasks</div>
            )}
        </>
    )
}

export default MeetingPreparationViewItem
