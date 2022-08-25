import React from 'react'
import { useDragLayer, XYCoord } from 'react-dnd'
import styled from 'styled-components'

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
    background-color: red;
    padding: 10px;
    border-radius: 7px;
    display: inline-block;
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
    }
}

// const renderDragItem = (item: any, itemType: string) => {
//     switch (itemType) {
//         case ItemT:
//             return <DragItem>{item.text}</DragItem>;
//         default:
//             return null;
//     }
// }

// This defines the appearance of dragged items in the app
const DragLayer = () => {
    const {
        // itemType,
        isDragging,
        item,
        initialOffset,
        currentOffset,
    } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
    }))
    const renderItem = () => {
        return <div>hi there fren</div>
    }
    if (!isDragging) {
        return null
    }
    console.log({ item })
    return (
        <DragOverlay>
            <div style={getDragLayerStyles(initialOffset, currentOffset)}>
                <DragItem>{renderItem()}</DragItem>
            </div>
        </DragOverlay>
    )
}

export default DragLayer
