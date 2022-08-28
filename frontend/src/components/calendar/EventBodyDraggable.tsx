import React, { ReactNode, useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { DropType, TEvent } from '../../utils/types'

interface EventBodyDraggableProps {
    event: TEvent
    children: ReactNode
}
const EventBodyDraggable = ({ event, children }: EventBodyDraggableProps) => {
    const [isDragging, drag, dragPreview] = useDrag(
        () => ({
            type: DropType.EVENT,
            item: { event },
            collect: (monitor) => monitor.isDragging(),
        }),
        [event]
    )

    useEffect(() => {
        dragPreview(getEmptyImage())
    }, [])

    return <div ref={drag}>{!isDragging && children}</div>
}

export default EventBodyDraggable
