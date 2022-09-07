import { EVENT_CREATION_INTERVAL_IN_MINUTES, EVENT_CREATION_INTERVAL_HEIGHT, EVENT_CREATION_INTERVAL_PER_HOUR, CALENDAR_DAY_HEADER_HEIGHT, CELL_HEIGHT_VALUE } from "../CalendarEvents-styles"
import { DropItem, DropType, TEvent } from "../../../utils/types"
import { DropTargetMonitor, useDrop } from "react-dnd"

import { DateTime } from "luxon"
import { useCallback, useMemo, useState } from "react"
import { useCreateEvent, useModifyEvent } from "../../../services/api/events.hooks"
import { useEffect } from 'react'
import { getDiffBetweenISOTimes } from "../../../utils/time"

interface CalendarDropArgs {
    primaryAccountID: string | undefined
    date: DateTime
    eventsContainerRef: React.MutableRefObject<HTMLDivElement | null>
    isWeekView: boolean
}

const useCalendarDrop = ({
    primaryAccountID,
    date,
    eventsContainerRef,
    isWeekView,
}: CalendarDropArgs) => {
    const { mutate: createEvent } = useCreateEvent()
    const { mutate: modifyEvent } = useModifyEvent()
    const [dropPreviewPosition, setDropPreviewPosition] = useState(0)
    const [eventPreview, setEventPreview] = useState<TEvent>()

    const getTimeFromDropPosition = useCallback((dropPosition: number) => date.set({
        hour: dropPosition / EVENT_CREATION_INTERVAL_PER_HOUR,
        minute: (dropPosition % EVENT_CREATION_INTERVAL_PER_HOUR) * EVENT_CREATION_INTERVAL_IN_MINUTES,
        second: 0,
        millisecond: 0,
    }), [date])

    const eventPreviewAtHoverTime: TEvent | undefined = useMemo(() => {
        if (!eventPreview) return undefined
        const start = getTimeFromDropPosition(dropPreviewPosition)
        const duration = getDiffBetweenISOTimes(eventPreview.datetime_start, eventPreview.datetime_end)
        const end = start.plus(duration)
        return {
            ...eventPreview,
            datetime_start: start.toISO(),
            datetime_end: end.toISO(),
        }
    }, [eventPreview, dropPreviewPosition])

    // returns index of 15 minute block on the calendar, i.e. 12 am is 0, 12:15 AM is 1, etc.
    const getDropPosition = useCallback((monitor: DropTargetMonitor) => {
        const clientOffset = monitor.getClientOffset()
        const itemType = monitor.getItemType()
        // if dragging an event, the distance from the mouse to the top of the event
        let mouseFromEventTopOffset = 0
        if (itemType === DropType.EVENT) {
            const initialClientOffset = monitor.getInitialClientOffset()
            const initialSourceClientOffset = monitor.getInitialSourceClientOffset()
            const { event } = monitor.getItem<DropItem>()
            if (initialClientOffset && initialSourceClientOffset && event) {
                const startTime = DateTime.fromISO(event.datetime_start)
                const eventBodyTop = CELL_HEIGHT_VALUE * startTime.diff(startTime.startOf('day'), 'hours').hours
                mouseFromEventTopOffset = initialClientOffset.y - initialSourceClientOffset.y - eventBodyTop
            }
        }
        // snap drop position to mouse position
        if (itemType === DropType.EVENT || itemType === DropType.EVENT_RESIZE_HANDLE) {
            mouseFromEventTopOffset -= (EVENT_CREATION_INTERVAL_HEIGHT / 2)
        }
        if (!eventsContainerRef?.current || !clientOffset || !primaryAccountID) return 0
        const eventsContainerOffset = eventsContainerRef.current.getBoundingClientRect().y
        const scrollOffset = eventsContainerRef.current.scrollTop - (isWeekView ? CALENDAR_DAY_HEADER_HEIGHT : 0)
        const yPosInEventsContainer = clientOffset.y - eventsContainerOffset + scrollOffset - mouseFromEventTopOffset
        return Math.floor(yPosInEventsContainer / EVENT_CREATION_INTERVAL_HEIGHT)
    }, [primaryAccountID, isWeekView])

    const onDrop = useCallback((item: DropItem, monitor: DropTargetMonitor) => {
        const itemType = monitor.getItemType()
        if (!primaryAccountID) return
        const dropPosition = getDropPosition(monitor)
        const dropTime = getTimeFromDropPosition(dropPosition)
        switch (itemType) {
            case DropType.TASK: {
                if (!item.task) return
                const end = dropTime.plus({ minutes: 30 })
                let description = item.task.body
                if (description !== '') {
                    description += '\n'
                }
                description += '<a href="https://generaltask.com/" __is_owner="true">created by General Task</a>'
                createEvent({
                    createEventPayload: {
                        account_id: primaryAccountID,
                        datetime_start: dropTime.toISO(),
                        datetime_end: end.toISO(),
                        summary: item.task?.title,
                        description,
                    },
                    date,
                    linkedTask: item.task,
                })
                break
            }
            case DropType.EVENT: {
                if (!item.event) return
                const end = dropTime.plus(getDiffBetweenISOTimes(item.event.datetime_start, item.event.datetime_end))
                modifyEvent({
                    event: item.event,
                    payload: {
                        account_id: primaryAccountID,
                        datetime_start: dropTime.toISO(),
                        datetime_end: end.toISO(),
                    },
                    date,
                })
                break
            }
            case DropType.EVENT_RESIZE_HANDLE: {
                if (!item.event) return
                const eventStart = DateTime.fromISO(item.event.datetime_start)
                // if end is after start, use drop location, otherwise set to 15 minutes after event started
                const end = (dropTime.diff(eventStart).milliseconds > 0)
                    ? dropTime
                    : eventStart.plus({ minutes: EVENT_CREATION_INTERVAL_IN_MINUTES })
                modifyEvent({
                    event: item.event,
                    payload: {
                        account_id: primaryAccountID,
                        datetime_end: end.toISO(),
                    },
                    date,
                })
            }
        }
    },
        [date, primaryAccountID]
    )

    const [isOver, drop] = useDrop(() => ({
        accept: [DropType.TASK, DropType.EVENT, DropType.EVENT_RESIZE_HANDLE],
        collect: (monitor) => {
            return monitor.isOver()
        },
        drop: onDrop,
        canDrop: () => primaryAccountID !== undefined,
        hover: (item, monitor) => {
            const dropPosition = getDropPosition(monitor)
            const itemType = monitor.getItemType()
            switch (itemType) {
                case DropType.TASK: {
                    setEventPreview(undefined)
                    setDropPreviewPosition(dropPosition)
                    break
                }
                case DropType.EVENT: {
                    if (!item.event) return
                    setDropPreviewPosition(dropPosition)
                    setEventPreview(item.event)
                    break
                }
                case DropType.EVENT_RESIZE_HANDLE: {
                    if (!item.event) return
                    const eventStart = DateTime.fromISO(item.event.datetime_start)
                    // index of 15 minute block of the start time
                    const eventStartPosition = eventStart.diff(date.startOf('day'), 'minutes').minutes / EVENT_CREATION_INTERVAL_IN_MINUTES
                    setDropPreviewPosition(eventStartPosition)
                    const dropTime = getTimeFromDropPosition(dropPosition)
                    const end = (dropTime.diff(eventStart).milliseconds > 0)
                        ? dropTime
                        : eventStart.plus({ minutes: EVENT_CREATION_INTERVAL_IN_MINUTES })
                    setEventPreview({
                        ...item.event,
                        datetime_end: end.toISO(),
                    })
                    break
                }
            }
        },
    }),
        [primaryAccountID, onDrop, date]
    )

    useEffect(() => {
        drop(eventsContainerRef)
    }, [eventsContainerRef])

    return { isOver, dropPreviewPosition, eventPreview: eventPreviewAtHoverTime }
}

export default useCalendarDrop
