import { DateTime } from 'luxon'
import { useRef, useState } from 'react'
import { EVENTS_REFETCH_INTERVAL, NO_EVENT_TITLE, SINGLE_SECOND_INTERVAL } from '../constants'
import { useGetEvents } from '../services/api/events.hooks'
import { useInterval } from '.'
import { TEvent } from '../utils/types'
import toast, { dismissToast, isActive, updateToast } from '../utils/toast'

interface EventBannerLastShownAt {
    [key: string]: number
}

const isEventWithin10Minutes = (event: TEvent) => {
    const eventStart = DateTime.fromISO(event.datetime_start)
    const eventEnd = DateTime.fromISO(event.datetime_end)
    return eventStart < DateTime.now().plus({ minutes: 10 }) && eventEnd > DateTime.now()
}

export default function useEventBanners(date: DateTime) {
    const [eventsWithin10Minutes, setEventsWithin10Minutes] = useState<TEvent[]>([])
    const eventBannerStates = useRef<EventBannerLastShownAt>({})
    const { data: events, refetch } = useGetEvents(
        {
            startISO: date.startOf('day').toISO(),
            endISO: date.endOf('day').plus({ minutes: 15 }).toISO(),
        },
        'banner'
    )
    useInterval(refetch, EVENTS_REFETCH_INTERVAL)

    useInterval(
        () => {
            const updatedEvents = events?.filter((event) => isEventWithin10Minutes(event))
            if (updatedEvents && updatedEvents !== eventsWithin10Minutes) {
                setEventsWithin10Minutes(updatedEvents)
            }
        },
        SINGLE_SECOND_INTERVAL,
        false
    )

    Object.keys(eventBannerStates.current).forEach((id) => {
        if (!eventsWithin10Minutes.map((event) => event.id).includes(id)) {
            dismissToast(id)
            delete eventBannerStates.current[id]
        }
    })

    eventsWithin10Minutes.map((event) => {
        const timeUntilEvent = Math.ceil((new Date(event.datetime_start).getTime() - new Date().getTime()) / 1000 / 60)
        const timeUntilEventMessage = timeUntilEvent > 0 ? `is in ${timeUntilEvent} minutes.` : 'is now.'
        const eventTitle = event.title.length > 0 ? event.title : NO_EVENT_TITLE
        const lastShownAt = eventBannerStates.current[event.id] || undefined

        if (isActive(event.id)) {
            updateToast(event.id, { message: `${eventTitle} ${timeUntilEventMessage}` })
            eventBannerStates.current = { ...eventBannerStates.current, [event.id]: timeUntilEvent }
        } else {
            if (!lastShownAt || (lastShownAt > timeUntilEvent && [0, 1, 5].includes(timeUntilEvent))) {
                toast(
                    { message: `${eventTitle} ${timeUntilEventMessage}` },
                    {
                        toastId: event.id,
                        autoClose: false,
                        theme: 'light',
                    }
                )
                eventBannerStates.current = { ...eventBannerStates.current, [event.id]: timeUntilEvent }
            }
        }
    })
}
