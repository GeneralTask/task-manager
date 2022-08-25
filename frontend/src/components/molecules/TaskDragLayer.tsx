import React from 'react'
import { useDragLayer } from 'react-dnd'

const TaskDragLayer = () => {
    useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
    }))
    return <div>wassupppp</div>
}

export default TaskDragLayer
