import React, { useRef } from 'react'
import { useParams } from 'react-router-dom'
import { TTask } from '../../../utils/types'
import Task from '../../molecules/Task'
import { ViewItemsProps } from './viewItems.types'

const ExternalViewItems = ({ view, visibleItemsCount }: ViewItemsProps) => {
    const { overviewItem } = useParams()

    // TODO: either change Task to make this optional or add better support for scrolling. Unused for now.
    const scrollingRef = useRef<HTMLDivElement>(null)

    return (
        <div ref={scrollingRef}>
            {view.view_items.slice(0, visibleItemsCount).map((item) => (
                <Task
                    key={item.id}
                    task={item as TTask}
                    dragDisabled={true}
                    sectionScrollingRef={scrollingRef}
                    isSelected={overviewItem === item.id}
                    link={`/overview/${item.id}`}
                />
            ))}
        </div>
    )
}

export default ExternalViewItems
