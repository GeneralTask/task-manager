import { DateTime } from 'luxon'
import React from 'react'
import { TEvent } from '../../utils/types'
import EventBody from './EventBody'
import EventBodyDraggable from './EventBodyDraggable'
import { createEventColumns } from './utils/eventLayout'

interface CollisionGroupColumnsProps {
    events: TEvent[]
    date: DateTime
    eventDetailId: string
    setEventDetailId: (id: string) => void
    isScrollDisabled: boolean
    setIsScrollDisabled: (id: boolean) => void
    isEventSelected: boolean
    setIsEventSelected: (id: boolean) => void
}

const CollisionGroupColumns = (props: CollisionGroupColumnsProps): JSX.Element => {
    const eventColumns = createEventColumns(props.events)

    return (
        <>
            {eventColumns.map((column, index) =>
                column.map((event) => (
                    <EventBodyDraggable key={event.id} event={event}>
                        <EventBody
                            key={event.id}
                            event={event}
                            eventDetailId={props.eventDetailId}
                            setEventDetailId={props.setEventDetailId}
                            leftOffset={index}
                            collisionGroupSize={eventColumns.length}
                            date={props.date}
                            isSelected={props.eventDetailId === event.id}
                            isScrollDisabled={props.isScrollDisabled}
                            setIsScrollDisabled={props.setIsScrollDisabled}
                            isEventSelected={props.isEventSelected}
                            setIsEventSelected={props.setIsEventSelected}
                        />
                    </EventBodyDraggable>
                ))
            )}
        </>
    )
}

export default CollisionGroupColumns
