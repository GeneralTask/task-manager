import React, { useRef } from 'react'
import { TOverviewBlock } from '../../../utils/types'
import Task from '../../molecules/Task'
import TaskDropContainer from '../../molecules/TaskDropContainer'

const TaskSectionBlockItems = ({ block }: { block: TOverviewBlock }) => {
    const { section_id: sectionId } = block

    const ref = useRef<HTMLDivElement>(null)

    if (!sectionId) {
        return null
    }
    return (
        <div ref={ref}>
            {block.view_items.map((item, index) => (
                // <div key={item.id}>{item.title}</div>
                <TaskDropContainer key={item.id} task={item} taskIndex={index} sectionId={sectionId}>
                    <Task
                        key={item.id}
                        task={item}
                        dragDisabled={true}
                        index={index}
                        sectionId={sectionId}
                        sectionScrollingRef={ref}
                        link={`/overview/${item.id}`}
                    />
                </TaskDropContainer>
            ))}
        </div>
    )
}

export default TaskSectionBlockItems
