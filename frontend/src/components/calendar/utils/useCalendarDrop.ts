import { CALENDAR_DAY_HEADER_HEIGHT, CELL_HEIGHT_VALUE } from "../CalendarEvents-styles"
import { DropItem, DropType } from "../../../utils/types"
import { DropTargetMonitor, useDrop } from "react-dnd"

import { CALENDAR_DEFAULT_EVENT_DURATION } from "../../../constants"
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

    const onDrop = useCallback(
        async (item: DropItem, monitor: DropTargetMonitor) => {
            console.log({ itemType: monitor.getItemType() })
            const dropPosition = monitor.getClientOffset()
            if (!eventsContainerRef?.current || !dropPosition || !accountId) return
            const eventsContainerOffset = eventsContainerRef.current.getBoundingClientRect().y
            const scrollOffset = eventsContainerRef.current.scrollTop

            const yPosInEventsContainer = dropPosition.y - eventsContainerOffset + scrollOffset

            // index of 30 minute block on the calendar, i.e. 12 am is 0, 12:30 AM is 1, etc.
            const dropTimeBlock = Math.floor(
                yPosInEventsContainer / ((CELL_HEIGHT_VALUE * CALENDAR_DEFAULT_EVENT_DURATION) / 60)
            )

            const start = date.set({
                hour: dropTimeBlock / 2,
                minute: dropTimeBlock % 2 === 0 ? 0 : 30,
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
            canDrop: () => true,//accountId !== undefined,
            hover: (_, monitor) => {
                const dropPosition = monitor.getClientOffset()
                if (!eventsContainerRef.current || !dropPosition || !accountId) return
                const eventsContainerOffset = eventsContainerRef.current.getBoundingClientRect().y
                const scrollOffset = eventsContainerRef.current.scrollTop

                const yPosInEventsContainer = dropPosition.y - eventsContainerOffset + scrollOffset

                // index of 30 minute block on the calendar, i.e. 12 am is 0, 12:30 AM is 1, etc.
                const dropTimeBlock = Math.floor(
                    (yPosInEventsContainer - CALENDAR_DAY_HEADER_HEIGHT) /
                    ((CELL_HEIGHT_VALUE * CALENDAR_DEFAULT_EVENT_DURATION) / 60)
                )
                // console.log('hovering over', dayOffset)
                console.log(dropTimeBlock)
                setDropPreviewPosition(dropTimeBlock)
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
