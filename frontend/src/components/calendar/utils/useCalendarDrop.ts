import { DEFAULT_EVENT_HEIGHT } from "../CalendarEvents-styles"
import { DropItem, DropType } from "../../../utils/types"
import { DropTargetMonitor, useDrop } from "react-dnd"

import { DateTime } from "luxon"
import { useCallback, useState } from "react"
import { useCreateEvent } from "../../../services/api/events.hooks"
import { useEffect } from 'react'

interface CalendarDropProps {
    accountId: string | undefined
    date: DateTime
    eventsContainerRef: React.MutableRefObject<HTMLDivElement | null>
}

const useCalendarDrop = ({
    accountId,
    date,
    eventsContainerRef,
}: CalendarDropProps) => {
    const { mutate: createEvent } = useCreateEvent()
    const [dropPreviewPosition, setDropPreviewPosition] = useState(0)

    // returns index of 30 minute block on the calendar, i.e. 12 am is 0, 12:30 AM is 1, etc.
    const getDropPosition = useCallback((monitor: DropTargetMonitor) => {
        const clientOffset = monitor.getClientOffset()
        if (!eventsContainerRef?.current || !clientOffset || !accountId) return 0
        const eventsContainerOffset = eventsContainerRef.current.getBoundingClientRect().y
        const scrollOffset = eventsContainerRef.current.scrollTop
        const yPosInEventsContainer = clientOffset.y - eventsContainerOffset + scrollOffset
        return Math.floor(yPosInEventsContainer / DEFAULT_EVENT_HEIGHT)
    }, [accountId])

    const onDrop = useCallback(
        async (item: DropItem, monitor: DropTargetMonitor) => {
            if (!accountId) return
            const dropPosition = getDropPosition(monitor)

            const start = date.set({
                hour: dropPosition / 2,
                minute: dropPosition % 2 === 0 ? 0 : 30,
                second: 0,
                millisecond: 0,
            })
            const end = start.plus({ minutes: 30 })

            createEvent({
                createEventPayload: {
                    account_id: accountId,
                    datetime_start: start.toISO(),
                    datetime_end: end.toISO(),
                    summary: item.task?.title,
                    description: item.task?.body,
                },
                date,
            })
        },
        [date, accountId, createEvent]
    )

    const [isOver, drop] = useDrop(
        () => ({
            accept: DropType.TASK,
            collect: (monitor) => {
                return monitor.isOver()
            },
            drop: onDrop,
            canDrop: () => accountId !== undefined,
            hover: (_, monitor) => {
                setDropPreviewPosition(getDropPosition(monitor))
            },
        }),
        [accountId, onDrop]
    )

    useEffect(() => {
        drop(eventsContainerRef)
    }, [eventsContainerRef])

    return { isOver, dropPreviewPosition }
}

export default useCalendarDrop
