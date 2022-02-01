import React from 'react'
import { TEvent } from '../../helpers/types'
import EventBody from './EventBody'
import { createEventColumns } from './utils/eventLayout'

interface CollisionGroupColumnsProps {
    events: TEvent[]
}

const CollisionGroupColumns = ({ events }: CollisionGroupColumnsProps): JSX.Element => {
    const eventColumns = createEventColumns(events)
    const numColumns = eventColumns.length
    const eventBodies: JSX.Element[] = []

    eventColumns.forEach((column, index) => {
        column.forEach((event) => {
            eventBodies.push(
                <EventBody key={event.id}
                    event={event}
                    leftOffset={index}
                    collisionGroupSize={numColumns} />
            )
        })
    })
    return (<>{eventBodies}</>)
}

export default CollisionGroupColumns
