import React, { useRef } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { TOverviewView } from '../../../utils/types'
import Task from '../../molecules/Task'

const PaddedContainer = styled.div`
    padding: 2px 0;
`

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
                <PaddedContainer key={item.id}>
                    <Task
                        task={item}
                        dragDisabled={!isReorderable}
                        index={index}
                        sectionScrollingRef={scrollingRef}
                        isSelected={overviewItem === item.id}
                        link={`/overview/${item.id}`}
                    />
                </PaddedContainer>
            ))}
        </div>
    )
}

export default LinearViewItems
