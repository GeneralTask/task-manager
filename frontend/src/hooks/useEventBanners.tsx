import { useCallback, useRef } from 'react'
import { toast } from 'react-toastify'
import { DateTime } from 'luxon'
import { useInterval, useKeyboardShortcut } from '.'
import ToastTemplate from '../components/atoms/toast/ToastTemplate'
import { NO_TITLE, SINGLE_SECOND_INTERVAL } from '../constants'
import { useEvents } from '../services/api/events.hooks'
import { icons } from '../styles/images'
import { getStartOfDay } from '../utils/time'
import { TEvent } from '../utils/types'

const isEventWithinTenMinutes = (event: TEvent) => {
    const eventStart = DateTime.fromISO(event.datetime_start)
    const eventEnd = DateTime.fromISO(event.datetime_end)
    return eventStart < DateTime.now().plus({ minutes: 10 }) && eventEnd > DateTime.now()
}

export default function useEventBanners(date: DateTime) {
    const eventBannerLastShownAt = useRef<Map<string, number>>(new Map<string, number>())
    const eventsWithinTenMinutes = useRef<TEvent[]>([])
    const { data: events } = useEvents(
        {
            startISO: getStartOfDay(date).toISO(),
            endISO: date.endOf('day').plus({ minutes: 15 }).toISO(),
        },
        'banner'
    )

    useInterval(
        () => {
            const updatedEvents = events?.filter((event) => isEventWithinTenMinutes(event))
            if (updatedEvents) {
                eventsWithinTenMinutes.current = updatedEvents
            }
            eventBannerLastShownAt.current.forEach((_, id) => {
                if (!eventsWithinTenMinutes.current.map((event) => event.id).includes(id)) {
                    toast.dismiss(id)
                    eventBannerLastShownAt.current.delete(id)
                }
            })

            eventsWithinTenMinutes.current.map((event) => {
                const timeUntilEvent = Math.ceil(
                    (new Date(event.datetime_start).getTime() - new Date().getTime()) / 1000 / 60
                )
                const timeUntilEventMessage =
                    timeUntilEvent > 0
                        ? `is in ${timeUntilEvent} ${timeUntilEvent > 1 ? 'minutes' : 'minute'}.`
                        : 'is now.'
                const eventTitle = event.title.length > 0 ? event.title : NO_TITLE
                const lastShownAt = eventBannerLastShownAt.current.get(event.id)
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
                    eventBannerLastShownAt.current.set(event.id, timeUntilEvent)
                } else {
                    if (
                        lastShownAt === undefined ||
                        (lastShownAt > timeUntilEvent && [0, 1, 5].includes(timeUntilEvent))
                    ) {
                        toast(<ToastTemplate {...toastProps} />, {
                            toastId: event.id,
                            autoClose: false,
                            closeOnClick: false,
                            theme: 'light',
                        })
                        eventBannerLastShownAt.current.set(event.id, timeUntilEvent)
                    }
                }
            })
        },
        SINGLE_SECOND_INTERVAL,
        false
    )

    useKeyboardShortcut(
        'joinCurrentMeeting',
        useCallback(() => {
            const currentMeetings = eventsWithinTenMinutes.current.filter(
                (event) => isEventWithinTenMinutes(event) && event.conference_call?.url
            )
            if (currentMeetings.length === 0) return
            currentMeetings.sort((a, b) => +DateTime.fromISO(b.datetime_start) - +DateTime.fromISO(a.datetime_start))
            window.open(currentMeetings[0].conference_call.url, '_blank')
        }, [eventsWithinTenMinutes]),
        !eventsWithinTenMinutes.current.find((event) => isEventWithinTenMinutes(event))?.conference_call.url
    )
}
