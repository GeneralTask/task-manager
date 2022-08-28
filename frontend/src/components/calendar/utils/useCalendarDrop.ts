import { EVENT_CREATION_INTERVAL_IN_MINUTES, EVENT_CREATION_INTERVAL_HEIGHT, EVENT_CREATION_INTERVAL_PER_HOUR, CALENDAR_DAY_HEADER_HEIGHT, CELL_HEIGHT_VALUE } from "../CalendarEvents-styles"
import { DropItem, DropType, TEvent } from "../../../utils/types"
import { DropTargetMonitor, useDrop } from "react-dnd"

import { DateTime } from "luxon"
import { useCallback, useMemo, useState } from "react"
import { useCreateEvent, useModifyEvent } from "../../../services/api/events.hooks"
import { useEffect } from 'react'
import { getDiffBetweenISOTimes } from "../../../utils/time"

interface CalendarDropProps {
    accountId: string | undefined
    date: DateTime
    eventsContainerRef: React.MutableRefObject<HTMLDivElement | null>
    isWeekView: boolean
}

const useCalendarDrop = ({
    accountId,
    date,
    eventsContainerRef,
    isWeekView,
}: CalendarDropProps) => {
    const { mutate: createEvent } = useCreateEvent()
    const { mutate: modifyEvent } = useModifyEvent()
    const [dropPreviewPosition, setDropPreviewPosition] = useState(0)
    const [eventPreview, setEventPreview] = useState<TEvent>()

    const getStartTimeFromDropPosition = useCallback((dropPosition: number) => date.set({
        hour: dropPosition / EVENT_CREATION_INTERVAL_PER_HOUR,
        minute: (dropPosition % EVENT_CREATION_INTERVAL_PER_HOUR) * EVENT_CREATION_INTERVAL_IN_MINUTES,
        second: 0,
        millisecond: 0,
    }), [date])

    const eventPreviewAtHoverTime: TEvent | undefined = useMemo(() => {
        if (!eventPreview) return undefined
        const start = getStartTimeFromDropPosition(dropPreviewPosition)
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
        // if dragging an event, the distance from the mouse to the top of the event
        let mouseFromEventTopOffset = 0
        if (monitor.getItemType() === DropType.EVENT) {
            const initialClientOffset = monitor.getInitialClientOffset()
            const initialSourceClientOffset = monitor.getInitialSourceClientOffset()
            const { event } = monitor.getItem<DropItem>()
            if (initialClientOffset && initialSourceClientOffset && event) {
                const startTime = DateTime.fromISO(event.datetime_start)
                const eventBodyTop = CELL_HEIGHT_VALUE * startTime.diff(startTime.startOf('day'), 'hours').hours
                mouseFromEventTopOffset = initialClientOffset.y - initialSourceClientOffset.y - eventBodyTop - (EVENT_CREATION_INTERVAL_HEIGHT / 2)
            }
        }
        if (!eventsContainerRef?.current || !clientOffset || !accountId) return 0
        const eventsContainerOffset = eventsContainerRef.current.getBoundingClientRect().y
        const scrollOffset = eventsContainerRef.current.scrollTop - (isWeekView ? CALENDAR_DAY_HEADER_HEIGHT : 0)
        const yPosInEventsContainer = clientOffset.y - eventsContainerOffset + scrollOffset - mouseFromEventTopOffset
        return Math.floor(yPosInEventsContainer / EVENT_CREATION_INTERVAL_HEIGHT)
    }, [accountId, isWeekView])

    const onDrop = useCallback(
        async (item: DropItem, monitor: DropTargetMonitor) => {
            setEventPreview(undefined)
            const itemType = monitor.getItemType()
            if (!accountId) return
            const dropPosition = getDropPosition(monitor)
            if (itemType === DropType.TASK) {
                const start = getStartTimeFromDropPosition(dropPosition)
                const end = start.plus({ minutes: 30 })
                createEvent({
                    payload: {
                        account_id: accountId,
                        datetime_start: start.toISO(),
                        datetime_end: end.toISO(),
                        summary: item.task?.title,
                        description: item.task?.body,
                    },
                    date,
                })
            }
            else if (itemType === DropType.EVENT) {
                if (!item.event) return
                const start = getStartTimeFromDropPosition(dropPosition)
                const end = start.plus(getDiffBetweenISOTimes(item.event.datetime_start, item.event.datetime_end))

                modifyEvent({
                    event: item.event,
                    payload: {
                        account_id: accountId,
                        datetime_start: start.toISO(),
                        datetime_end: end.toISO(),
                    },
                    date,
                })
            }
        },
        [date, accountId, createEvent]
    )

    const [isOver, drop] = useDrop(
        () => ({
            accept: [DropType.TASK, DropType.EVENT],
            collect: (monitor) => {
                return monitor.isOver()
            },
            drop: onDrop,
            canDrop: () => accountId !== undefined,
            hover: (item, monitor) => {
                setDropPreviewPosition(getDropPosition(monitor))
                const itemType = monitor.getItemType()
                if (itemType === DropType.EVENT && item.event) {
                    // setEventPreview({ ...item.event, id: '' })
                    setEventPreview(item.event)
                } else {
                    setEventPreview(undefined)
                }
            },
        }),
        [accountId, onDrop, date]
    )

    useEffect(() => {
        drop(eventsContainerRef)
    }, [eventsContainerRef])

    return { isOver, dropPreviewPosition, eventPreview: eventPreviewAtHoverTime }
}

export default useCalendarDrop
