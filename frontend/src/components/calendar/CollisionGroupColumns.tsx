import { DateTime } from 'luxon'

import { TEvent } from '../../utils/types'
import EventBody from './EventBody'
import EventBodyDraggable from './EventBodyDraggable'
import { createEventColumns } from './utils/eventLayout'

interface CollisionGroupColumnsProps {
    events: TEvent[]
    date: DateTime
}

const CollisionGroupColumns = (props: CollisionGroupColumnsProps): JSX.Element => {
    const eventColumns = createEventColumns(props.events)
    return (
        <>
            {eventColumns.map((column, index) =>
                column.map((event) => (
                    <EventBodyDraggable key={event.id} event={event}>
                        <EventBody
                            event={event}
                            leftOffset={index}
                            collisionGroupSize={eventColumns.length}
                            date={props.date}
                        />
                    </EventBodyDraggable>
                ))
            )}
        </>
    )
}

export default CollisionGroupColumns
