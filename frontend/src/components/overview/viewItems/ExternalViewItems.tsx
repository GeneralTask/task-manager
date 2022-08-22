import React from 'react'
import { useParams } from 'react-router-dom'
import { TTask } from '../../../utils/types'
import Task from '../../molecules/Task'
import { ViewItemsProps } from './viewItems.types'

const ExternalViewItems = ({ view, visibleItemsCount }: ViewItemsProps) => {
    const { overviewItem } = useParams()

    return (
        <>
            {view.view_items.slice(0, visibleItemsCount).map((item) => (
                <Task
                    key={item.id}
                    task={item as TTask}
                    dragDisabled={true}
                    isSelected={overviewItem === item.id}
                    link={`/overview/${item.id}`}
                />
            ))}
        </>
    )
}

export default ExternalViewItems
