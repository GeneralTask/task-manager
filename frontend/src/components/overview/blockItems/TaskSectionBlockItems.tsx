import React, { useRef } from 'react'
import { useParams } from 'react-router-dom'
import { TOverviewBlock } from '../../../utils/types'
import Task from '../../molecules/Task'
import TaskDropContainer from '../../molecules/TaskDropContainer'

const TaskSectionBlockItems = ({ block }: { block: TOverviewBlock }) => {
    const { section_id: sectionId } = block
    const { overviewItem } = useParams()

    // unused for now.
    // TODO: either change Task to make this optional or add better support for scrolling
    const scrollingRef = useRef<HTMLDivElement>(null)

    if (!sectionId) {
        return null
    }
    return (
        <div ref={scrollingRef}>
            {block.view_items.map((item, index) => (
                // <div key={item.id}>{item.title}</div>
                <TaskDropContainer key={item.id} task={item} taskIndex={index} sectionId={sectionId}>
                    <Task
                        key={item.id}
                        task={item}
                        dragDisabled={true}
                        index={index}
                        sectionId={sectionId}
                        sectionScrollingRef={scrollingRef}
                        isSelected={overviewItem === item.id}
                        link={`/overview/${item.id}`}
                    />
                </TaskDropContainer>
            ))}
        </div>
    )
}

export default TaskSectionBlockItems
