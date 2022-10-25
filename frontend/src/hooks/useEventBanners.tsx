import { useState } from 'react'
import { toast } from 'react-toastify'
import { DateTime } from 'luxon'
import { useInterval } from '.'
import ToastTemplate from '../components/atoms/toast/ToastTemplate'
import { NO_EVENT_TITLE, SINGLE_SECOND_INTERVAL } from '../constants'
import { useGetEvents } from '../services/api/events.hooks'
import { icons } from '../styles/images'
import { TEvent } from '../utils/types'

const eventBannerLastShownAt = new Map<string, number>()

const isEventWithinTenMinutes = (event: TEvent) => {
    const eventStart = DateTime.fromISO(event.datetime_start)
    const eventEnd = DateTime.fromISO(event.datetime_end)
    return eventStart < DateTime.now().plus({ minutes: 10 }) && eventEnd > DateTime.now()
}

export default function useEventBanners(date: DateTime) {
    const [eventsWithinTenMinutes, setEventsWithinTenMinutes] = useState<TEvent[]>([])
    const { data: events, refetch } = useGetEvents(
        {
            startISO: date.startOf('day').toISO(),
            endISO: date.endOf('day').plus({ minutes: 15 }).toISO(),
        },
        'banner'
    )

    useInterval(
        () => {
            const updatedEvents = events?.filter((event) => isEventWithinTenMinutes(event))
            if (updatedEvents) {
                setEventsWithinTenMinutes(updatedEvents)
            }
        },
        SINGLE_SECOND_INTERVAL,
        false
    )

    eventBannerLastShownAt.forEach((_, id) => {
        if (!eventsWithinTenMinutes.map((event) => event.id).includes(id)) {
            toast.dismiss(id)
            eventBannerLastShownAt.delete(id)
        }
    })

    eventsWithinTenMinutes.map((event) => {
        const timeUntilEvent = Math.ceil((new Date(event.datetime_start).getTime() - new Date().getTime()) / 1000 / 60)
        const timeUntilEventMessage =
            timeUntilEvent > 0 ? `is in ${timeUntilEvent} ${timeUntilEvent > 1 ? 'minutes' : 'minute'}.` : 'is now.'
        const eventTitle = event.title.length > 0 ? event.title : NO_EVENT_TITLE
        const lastShownAt = eventBannerLastShownAt.get(event.id)
        const toastProps = {
            title: eventTitle,
            message: timeUntilEventMessage,
            ...(event.conference_call?.url
                ? {
                      leftAction: {
                          icon: event.conference_call?.logo,
                          label: 'Join',
                          onClick: () => window.open(event.conference_call?.url, '_blank'),
                      },
                  }
                : event.deeplink && {
                      leftAction: {
                          icon: icons.external_link,
                          label: 'Open',
                          onClick: () => window.open(event.deeplink, '_blank'),
                      },
                  }),
        }
        if (toast.isActive(event.id)) {
            toast.update(event.id, { render: <ToastTemplate {...toastProps} /> })
            eventBannerLastShownAt.set(event.id, timeUntilEvent)
        } else {
            if (!lastShownAt || (lastShownAt > timeUntilEvent && [0, 1, 5].includes(timeUntilEvent))) {
                toast(<ToastTemplate {...toastProps} />, {
                    toastId: event.id,
                    autoClose: false,
                    closeOnClick: false,
                    theme: 'light',
                })
                eventBannerLastShownAt.set(event.id, timeUntilEvent)
            }
        }
    })
}
