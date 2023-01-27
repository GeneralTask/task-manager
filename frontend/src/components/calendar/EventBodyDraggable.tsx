import { ReactNode, useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import styled from 'styled-components'
import { DropType, TEvent } from '../../utils/types'

const DraggableContainer = styled.div<{ isDragging: boolean }>`
    opacity: ${({ isDragging }) => (isDragging ? 0.5 : 1)};
`

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
            canDrag: event.can_modify,
        }),
        [event]
    )

    useEffect(() => {
        dragPreview(getEmptyImage())
    }, [])

    return (
        <DraggableContainer ref={drag} isDragging={isDragging}>
            {children}
        </DraggableContainer>
    )
}

export default EventBodyDraggable
