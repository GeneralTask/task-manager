import React, { useMemo } from 'react'
import { useDragLayer, XYCoord } from 'react-dnd'
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

function getDragLayerStyles(initialOffset: XYCoord | null, currentOffset: XYCoord | null) {
    if (!initialOffset || !currentOffset) {
        return {
            display: 'none',
        }
    }

    const { x, y } = currentOffset

    const transform = `translate(${x}px, ${y}px)`
    return {
        transform,
        WebkitTransform: transform,
        width: DEFAULT_VIEW_WIDTH,
    }
}

// This defines the appearance of dragged items in the app
const DragLayer = () => {
    const { itemType, isDragging, item, initialOffset, currentOffset } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
    }))

    const dragPreview = useMemo(() => {
        if (itemType !== DropType.TASK || !item.task) return null
        return <Task task={item.task} dragDisabled isSelected link="" />
    }, [isDragging, itemType, item?.task])

    if (!isDragging) {
        return null
    }
    return (
        <DragOverlay>
            <div style={getDragLayerStyles(initialOffset, currentOffset)}>{dragPreview}</div>
        </DragOverlay>
    )
}

export default DragLayer
