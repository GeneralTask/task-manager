import React from 'react'
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
const DragItem = styled.div<{ transform: string }>`
    width: ${DEFAULT_VIEW_WIDTH};
    transform: ${({ transform }) => transform};
`

// This defines the appearance of dragged items in the app
const DragLayer = () => {
    const { itemType, isDragging, item, initialOffset, currentOffset } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
    }))
    if (!isDragging || itemType !== DropType.TASK || !item.task || !initialOffset || !currentOffset) {
        return null
    }
    return (
        <DragOverlay>
            {/* <DragItem transform={`translate(${currentOffset.x}px, ${currentOffset.y}px)`}> */}
            <Task task={item.task} dragDisabled isSelected link="" />
            {/* </DragItem> */}
        </DragOverlay>
    )
}

export default DragLayer
