import React, { useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import styled from 'styled-components'
import { DropType, TEvent } from '../../utils/types'
import { EVENT_BOTTOM_PADDING } from './CalendarEvents-styles'

// drag handle should fill the padding between the event and the bottom of the cell
const ResizeHandleContainer = styled.div`
    height: ${EVENT_BOTTOM_PADDING * 2}px;
    width: 100%;
    cursor: row-resize;
    position: absolute;
    bottom: -${EVENT_BOTTOM_PADDING}px;
    z-index: 2;
`

interface ResizeHandleProps {
    event: TEvent
}

const ResizeHandle = ({ event }: ResizeHandleProps) => {
    const [, drag, dragPreview] = useDrag(
        () => ({
            type: DropType.EVENT_RESIZE_HANDLE,
            item: { event },
            collect: (monitor) => monitor.isDragging(),
        }),
        [event]
    )
    useEffect(() => {
        dragPreview(getEmptyImage())
    }, [])
    return <ResizeHandleContainer ref={drag} />
}

export default ResizeHandle
