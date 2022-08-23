import React from 'react'
import { TTask } from '../../../utils/types'
import Task from '../../molecules/Task'
import { ViewItemsProps } from './viewItems.types'
import { useParams } from 'react-router-dom'

const ExternalViewItems = ({ view, visibleItemsCount, scrollRef }: ViewItemsProps) => {
    const { overviewViewId, overviewItemId } = useParams()

    return (
        <>
            {view.view_items.slice(0, visibleItemsCount).map((item) => (
                <Task
                    key={item.id}
                    task={item as TTask}
                    dragDisabled={true}
                    sectionScrollingRef={scrollRef}
                    isSelected={overviewViewId === view.id && overviewItemId === item.id}
                    link={`/overview/${view.id}/${item.id}`}
                />
            ))}
        </>
    )
}

export default ExternalViewItems
