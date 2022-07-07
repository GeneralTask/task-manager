import React, { useRef } from 'react'
import { useParams } from 'react-router-dom'
import { TOverviewView } from '../../../utils/types'
import Task from '../../molecules/Task'

interface LinearViewItemsProps {
    view: TOverviewView
}
const LinearViewItems = ({ view }: LinearViewItemsProps) => {
    const { is_reorderable: isReorderable } = view
    const { overviewItem } = useParams()

    // TODO: either change Task to make this optional or add better support for scrolling. Unused for now.
    const scrollingRef = useRef<HTMLDivElement>(null)

    return (
        <div ref={scrollingRef}>
            {view.view_items.map((item, index) => (
                <Task
                    key={item.id}
                    task={item}
                    dragDisabled={!isReorderable}
                    index={index}
                    sectionScrollingRef={scrollingRef}
                    isSelected={overviewItem === item.id}
                    link={`/overview/${item.id}`}
                />
            ))}
        </div>
    )
}

export default LinearViewItems
