import { TEvent } from '../../../utils/types'

function eventsDoOverlap(eventA: TEvent, eventB: TEvent): boolean {
    const eventAStart = new Date(eventA.datetime_start)
    const eventAEnd = new Date(eventA.datetime_end)
    const eventBStart = new Date(eventB.datetime_start)
    const eventBEnd = new Date(eventB.datetime_end)

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
    const collisionGroups: TEvent[][] = [[]]
    events.forEach((event) => {
        let placed = false
        for (const group of collisionGroups) {
            if (group.length === 0 || group.some(e => eventsDoOverlap(event, e))) {
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
            if (column.length === 0 || column.every(e => !eventsDoOverlap(event, e))) {
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
