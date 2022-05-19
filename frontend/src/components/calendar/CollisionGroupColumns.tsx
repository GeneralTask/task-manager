import { DateTime } from 'luxon'
import React from 'react'
import { TEvent } from '../../utils/types'
import EventBody from './EventBody'
import { createEventColumns } from './utils/eventLayout'

interface CollisionGroupColumnsProps {
    events: TEvent[]
    date: DateTime
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
                    leftOffset={index}
                    collisionGroupSize={numColumns}
                    date={props.date}
                />
            )
        })
    })
    return <>{eventBodies}</>
}

export default CollisionGroupColumns
