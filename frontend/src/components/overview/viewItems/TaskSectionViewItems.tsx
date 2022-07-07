import React, { useRef } from 'react'
import { useParams } from 'react-router-dom'
import { DropType, TOverviewView } from '../../../utils/types'
import { emptyFunction } from '../../../utils/utils'
import ReorderDropContainer from '../../atoms/ReorderDropContainer'
import Task from '../../molecules/Task'

interface TaskSectionViewItemsProps {
    view: TOverviewView
}
const TaskSectionViewItems = ({ view }: TaskSectionViewItemsProps) => {
    const { section_id: sectionId } = view
    const { overviewItem } = useParams()

    // TODO: either change Task to make this optional or add better support for scrolling. Unused for now.
    const scrollingRef = useRef<HTMLDivElement>(null)

    return (
        <div ref={scrollingRef}>
            {view.view_items.map((item, index) => (
                <ReorderDropContainer
                    key={item.id}
                    index={index}
                    acceptDropType={DropType.TASK}
                    onReorder={emptyFunction} // TODO: add reordering
                >
                    <Task
                        key={item.id}
                        task={item}
                        dragDisabled={!view.is_reorderable}
                        index={index}
                        sectionId={sectionId || ''}
                        sectionScrollingRef={scrollingRef}
                        isSelected={overviewItem === item.id}
                        link={`/overview/${item.id}`}
                    />
                </ReorderDropContainer>
            ))}
        </div>
    )
}

export default TaskSectionViewItems
