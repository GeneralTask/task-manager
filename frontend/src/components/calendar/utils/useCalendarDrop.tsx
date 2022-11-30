import { useCallback, useMemo, useState } from 'react'
import { useEffect } from 'react'
import { DropTargetMonitor, useDrop } from 'react-dnd'
import { renderToString } from 'react-dom/server'
import { DateTime } from 'luxon'
import showdown from 'showdown'
import { v4 as uuidv4 } from 'uuid'
import { GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME } from '../../../constants'
import { useToast } from '../../../hooks'
import { useCreateEvent, useModifyEvent } from '../../../services/api/events.hooks'
import { useGetSupportedTypes } from '../../../services/api/settings.hooks'
import { logos } from '../../../styles/images'
import { openPopupWindow } from '../../../utils/auth'
import { getDiffBetweenISOTimes } from '../../../utils/time'
import { DropItem, DropType, TEvent } from '../../../utils/types'
import { emptyFunction } from '../../../utils/utils'
import { NuxTaskBodyStatic } from '../../details/NUXTaskBody'
import {
    CELL_HEIGHT_VALUE,
    EVENT_CREATION_INTERVAL_HEIGHT,
    EVENT_CREATION_INTERVAL_IN_MINUTES,
    EVENT_CREATION_INTERVAL_PER_HOUR,
} from '../CalendarEvents-styles'

interface CalendarDropArgs {
    primaryAccountID: string | undefined
    date: DateTime
    eventsContainerRef: React.MutableRefObject<HTMLDivElement | null>
}

const useCalendarDrop = ({ primaryAccountID, date, eventsContainerRef }: CalendarDropArgs) => {
    const { mutate: createEvent } = useCreateEvent()
    const { mutate: modifyEvent } = useModifyEvent()
    const [dropPreviewPosition, setDropPreviewPosition] = useState(0)
    const [eventPreview, setEventPreview] = useState<TEvent>()
    const toast = useToast()
    const { data: supportedTypes } = useGetSupportedTypes()
    const googleSupportedType = supportedTypes?.find((type) => type.name === GOOGLE_CALENDAR_SUPPORTED_TYPE_NAME)

    const getTimeFromDropPosition = useCallback(
        (dropPosition: number) =>
            date.set({
                hour: dropPosition / EVENT_CREATION_INTERVAL_PER_HOUR,
                minute: (dropPosition % EVENT_CREATION_INTERVAL_PER_HOUR) * EVENT_CREATION_INTERVAL_IN_MINUTES,
                second: 0,
                millisecond: 0,
            }),
        [date]
    )

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
    const getDropPosition = useCallback(
        (monitor: DropTargetMonitor) => {
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
                mouseFromEventTopOffset -= EVENT_CREATION_INTERVAL_HEIGHT / 2
            }
            if (!eventsContainerRef?.current || !clientOffset || !primaryAccountID) return 0
            const eventsContainerOffset = eventsContainerRef.current.getBoundingClientRect().y
            const yPosInEventsContainer =
                clientOffset.y - eventsContainerOffset + eventsContainerRef.current.scrollTop - mouseFromEventTopOffset
            return Math.floor(yPosInEventsContainer / EVENT_CREATION_INTERVAL_HEIGHT)
        },
        [primaryAccountID]
    )

    const onDrop = useCallback(
        (item: DropItem, monitor: DropTargetMonitor) => {
            const itemType = monitor.getItemType()
            if (!primaryAccountID) {
                const toastProps = {
                    title: '',
                    message: 'Connect your Google account to create events from tasks.',
                    rightAction: {
                        icon: logos.gcal,
                        label: 'Connect',
                        onClick: () => {
                            openPopupWindow(googleSupportedType?.authorization_url ?? '', emptyFunction)
                        },
                    },
                }
                toast.show(toastProps, {
                    autoClose: 2000,
                    pauseOnFocusLoss: false,
                })
                return
            }
            const dropPosition = getDropPosition(monitor)
            const dropTime = getTimeFromDropPosition(dropPosition)
            switch (itemType) {
                case DropType.WEEK_TASK_TO_CALENDAR_TASK:
                case DropType.SUBTASK:
                case DropType.NON_REORDERABLE_TASK:
                case DropType.DUE_TASK:
                case DropType.TASK: {
                    if (!item.task) return
                    const end = dropTime.plus({ minutes: 30 })
                    const converter = new showdown.Converter()
                    let description
                    if (item.task.nux_number_id) {
                        // if this is a nux task, override body
                        description = renderToString(
                            <NuxTaskBodyStatic nux_number_id={item.task.nux_number_id} renderSettingsModal={false} />
                        )
                    } else {
                        description = converter.makeHtml(item.task.body)
                        if (description !== '') {
                            description += '\n'
                        }
                        description = description.replaceAll('\n', '<br>')
                        description +=
                            '<a href="https://generaltask.com/" __is_owner="true">created by General Task</a>'
                    }
                    createEvent({
                        createEventPayload: {
                            account_id: primaryAccountID,
                            datetime_start: dropTime.toISO(),
                            datetime_end: end.toISO(),
                            summary: item.task.title,
                            description,
                            task_id: item.task.id,
                        },
                        date,
                        linkedTask: item.task,
                        optimisticId: uuidv4(),
                    })
                    break
                }
                case DropType.EVENT: {
                    if (!item.event) return
                    const end = dropTime.plus(
                        getDiffBetweenISOTimes(item.event.datetime_start, item.event.datetime_end)
                    )
                    modifyEvent(
                        {
                            id: item.event.id,
                            event: item.event,
                            payload: {
                                account_id: item.event.account_id,
                                datetime_start: dropTime.toISO(),
                                datetime_end: end.toISO(),
                            },
                            date,
                        },
                        item.event.optimisticId
                    )
                    break
                }
                case DropType.EVENT_RESIZE_HANDLE: {
                    if (!item.event) return
                    const eventStart = DateTime.fromISO(item.event.datetime_start)
                    // if end is after start, use drop location, otherwise set to 15 minutes after event started
                    const end =
                        dropTime.diff(eventStart).milliseconds > 0
                            ? dropTime
                            : eventStart.plus({ minutes: EVENT_CREATION_INTERVAL_IN_MINUTES })
                    modifyEvent(
                        {
                            id: item.event.id,
                            event: item.event,
                            payload: {
                                account_id: item.event.account_id,
                                datetime_end: end.toISO(),
                            },
                            date,
                        },
                        item.event.optimisticId
                    )
                    break
                }
                case DropType.OVERVIEW_VIEW_HEADER: {
                    if (!item.view) return
                    const end = dropTime.plus({ minutes: 30 })
                    createEvent({
                        createEventPayload: {
                            summary: item.view.name,
                            account_id: primaryAccountID,
                            datetime_start: dropTime.toISO(),
                            datetime_end: end.toISO(),
                            view_id: item.view.id,
                        },
                        date,
                        linkedView: item.view,
                        optimisticId: uuidv4(),
                    })
                    break
                }
            }
        },
        [date, primaryAccountID]
    )

    const [isOver, drop] = useDrop(
        () => ({
            accept: [
                DropType.TASK,
                DropType.SUBTASK,
                DropType.NON_REORDERABLE_TASK,
                DropType.DUE_TASK,
                DropType.EVENT,
                DropType.EVENT_RESIZE_HANDLE,
                DropType.OVERVIEW_VIEW_HEADER,
                DropType.WEEK_TASK_TO_CALENDAR_TASK,
            ],
            collect: (monitor) => primaryAccountID && monitor.isOver(),
            drop: onDrop,
            hover: (item, monitor) => {
                const dropPosition = getDropPosition(monitor)
                const itemType = monitor.getItemType()
                switch (itemType) {
                    case DropType.WEEK_TASK_TO_CALENDAR_TASK:
                    case DropType.SUBTASK:
                    case DropType.NON_REORDERABLE_TASK:
                    case DropType.TASK: {
                        setEventPreview(undefined)
                        setDropPreviewPosition(dropPosition)
                        break
                    }
                    case DropType.DUE_TASK: {
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
                        const eventStartPosition =
                            eventStart.diff(date.startOf('day'), 'minutes').minutes / EVENT_CREATION_INTERVAL_IN_MINUTES
                        setDropPreviewPosition(eventStartPosition)
                        const dropTime = getTimeFromDropPosition(dropPosition)
                        const end =
                            dropTime.diff(eventStart).milliseconds > 0
                                ? dropTime
                                : eventStart.plus({ minutes: EVENT_CREATION_INTERVAL_IN_MINUTES })
                        setEventPreview({
                            ...item.event,
                            datetime_end: end.toISO(),
                        })
                        break
                    }
                    case DropType.OVERVIEW_VIEW_HEADER: {
                        setDropPreviewPosition(dropPosition)
                        setEventPreview(item.event)
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
