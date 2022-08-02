import { DateTime } from 'luxon'
import React from 'react'
import { TEvent } from '../../utils/types'
import EventBody from './EventBody'
import { createEventColumns } from './utils/eventLayout'

interface CollisionGroupColumnsProps {
    events: TEvent[]
    date: DateTime
    eventDetailId: string
    setEventDetailId: (id: string) => void
    // isSelected: boolean
    // setIsSelected: (id: boolean) => void
}

const CollisionGroupColumns = (props: CollisionGroupColumnsProps): JSX.Element => {
    const eventColumns = createEventColumns(props.events)
    const numColumns = eventColumns.length
    const eventBodies: JSX.Element[] = []

    eventColumns.forEach((column, index) => {
        column.forEach((event) => {
            eventBodies.push(
                <EventBody
                    key={event.id}
                    event={event}
                    eventDetailId={props.eventDetailId}
                    setEventDetailId={props.setEventDetailId}
                    leftOffset={index}
                    collisionGroupSize={numColumns}
                    date={props.date}
                    // isSelected={props.isSelected}
                    // setIsSelected={props.setIsSelected}
                />
            )
        })
    })
    return <>{eventBodies}</>
}

export default CollisionGroupColumns
