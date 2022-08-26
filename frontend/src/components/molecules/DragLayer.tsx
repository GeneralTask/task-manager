import React, { useEffect, useRef } from 'react'
import { useDragLayer } from 'react-dnd'
import styled from 'styled-components'
import { DEFAULT_VIEW_WIDTH } from '../../styles/dimensions'
import { DropType } from '../../utils/types'
import Task from './Task'

const DragOverlay = styled.div`
    position: fixed;
    pointer-events: none;
    z-index: 100;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
`
const DragItem = styled.div`
    width: calc(${DEFAULT_VIEW_WIDTH} - 40px);
    opacity: 0.5;
`

// This defines the appearance of dragged items in the app
const DragLayer = () => {
    const dragItemRef = useRef<HTMLDivElement>(null)
    const { itemType, isDragging, item, initialOffset, currentOffset } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
    }))

    // update the position of the drag item. This is much more performant than passing the coords into DragItem
    useEffect(() => {
        if (currentOffset && dragItemRef.current)
            dragItemRef.current.style.transform = `translate(${currentOffset.x}px, ${currentOffset.y}px)`
    }, [currentOffset])

    if (!isDragging || itemType !== DropType.TASK || !item.task || !initialOffset || !currentOffset) return null
    return (
        <DragOverlay>
            <DragItem ref={dragItemRef}>
                <Task task={item.task} dragDisabled isSelected link="" />
            </DragItem>
        </DragOverlay>
    )
}

export default DragLayer
