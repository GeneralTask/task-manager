import React, { useRef } from 'react'
import { useParams } from 'react-router-dom'
import { DropType, TTask } from '../../../utils/types'
import { emptyFunction } from '../../../utils/utils'
import ReorderDropContainer from '../../atoms/ReorderDropContainer'
import Task from '../../molecules/Task'
import { ViewItemsProps } from './viewItems.types'

const TaskSectionViewItems = ({ view, visibleItemsCount }: ViewItemsProps) => {
    const { task_section_id: sectionId } = view
    const { overviewItem } = useParams()

    console.log({ view })

    // TODO: either change Task to make this optional or add better support for scrolling. Unused for now.
    const scrollingRef = useRef<HTMLDivElement>(null)

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
                            dragDisabled={false}
                            index={index}
                            sectionId={sectionId}
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
