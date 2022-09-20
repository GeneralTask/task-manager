import { useEffect, useRef } from 'react'
import { useDragLayer } from 'react-dnd'
import styled from 'styled-components'
import { useIsDragging } from '../../hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { DEFAULT_VIEW_WIDTH } from '../../styles/dimensions'
import { DropType } from '../../utils/types'
import Task from './Task'

const ViewHeaderContainer = styled.div`
    width: 100%;
    background-color: white;
    border-radius: ${Border.radius.medium};
    display: flex;
    align-items: center;
    padding: ${Spacing._8};
    color: ${Colors.text.light};
    ${Typography.subtitle};
`
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
    const { itemType, item, initialOffset, currentOffset } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
    }))
    const isDragging = useIsDragging()

    // update the position of the drag item. This is much more performant than passing the coords into DragItem
    useEffect(() => {
        if (currentOffset && dragItemRef.current)
            dragItemRef.current.style.transform = `translate(${currentOffset.x}px, ${currentOffset.y}px)`
    }, [currentOffset])

    if (!isDragging || !initialOffset || !currentOffset) {
        return null
    } else if (itemType === DropType.OVERVIEW_VIEW) {
        return (
            <DragOverlay>
                <DragItem ref={dragItemRef}>
                    <ViewHeaderContainer>{item.view.name}</ViewHeaderContainer>
                </DragItem>
            </DragOverlay>
        )
    } else if (itemType === DropType.TASK && item.task) {
        return (
            <DragOverlay>
                <DragItem ref={dragItemRef}>
                    <Task task={item.task} dragDisabled isSelected link="" />
                </DragItem>
            </DragOverlay>
        )
    }
    return null
}

export default DragLayer
