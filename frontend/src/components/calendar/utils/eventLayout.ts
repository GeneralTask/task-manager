import { FIFTEEN_MINUTE_INTERVAL } from '../../../constants'
import { TEvent } from '../../../utils/types'

function eventsDoOverlap(eventA: TEvent, eventB: TEvent): boolean {
    const eventAStart = new Date(eventA.datetime_start)
    const eventBStart = new Date(eventB.datetime_start)

    let eventAEnd = new Date(eventA.datetime_end)
    let eventBEnd = new Date(eventB.datetime_end)

    // if the events are less than 15 minutes, consider duration to be 15 minutes
    if (eventAEnd.getTime() - eventAStart.getTime() < FIFTEEN_MINUTE_INTERVAL) {
        eventAEnd = new Date(eventAStart.getTime() + FIFTEEN_MINUTE_INTERVAL)
    }
    if (eventBEnd.getTime() - eventBStart.getTime() < FIFTEEN_MINUTE_INTERVAL) {
        eventBEnd = new Date(eventBStart.getTime() + FIFTEEN_MINUTE_INTERVAL)
    }

    return eventAStart < eventBEnd && eventAEnd > eventBStart
}

/**
 * Two events are considered to be in the same collision group if they overlap,
 * or if they share overlapping events.
 * For example, if event A and event B overlap, they are in the same collision group.
 * If event A and event C overlap, they are in the same collision group,
 * but also event B and Event C are in the same collision group since they both
 * overlap with event A.
 */
function findCollisionGroups(events: TEvent[]): TEvent[][] {
    events.sort((a, b) => a.title.localeCompare(b.title))
    const collisionGroups: TEvent[][] = [[]]
    events.forEach((event) => {
        let placed = false
        for (const group of collisionGroups) {
            if (group.length === 0 || group.some((e) => eventsDoOverlap(event, e))) {
                group.push(event)
                placed = true
                break
            }
        }
        if (!placed) collisionGroups.push([event])
    })
    return collisionGroups
}

/**
 * For each collision group, maximize the number of events that can be placed
 * in a single events column by greedily placing events into columns left to right.
 * An event can be placed into a column if it does not overlap with any other events
 * in the same column. Whenever an event does not fit into any of the existing columns,
 * start a new column.
 */
function createEventColumns(group: TEvent[]) {
    const columns: TEvent[][] = [[]]
    if (!group) return columns
    group.forEach((event) => {
        let placed = false
        for (const column of columns) {
            if (column.length === 0 || column.every((e) => !eventsDoOverlap(event, e))) {
                column.push(event)
                placed = true
                break
            }
        }
        if (!placed) columns.push([event])
    })
    return columns
}

export { findCollisionGroups, createEventColumns }
