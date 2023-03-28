import { useCallback, useEffect, useMemo, useRef } from 'react'
import { toast as hotToast, useToasterStore } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import { useKeyboardShortcut } from '.'
import { ToastArgs, toast } from '../components/molecules/toast/utils'
import { NO_TITLE } from '../constants'
import { useEvents } from '../services/api/events.hooks'
import { useCreateNote, useGetNotes } from '../services/api/notes.hooks'
import { useGetUserInfo } from '../services/api/user-info.hooks'
import { icons } from '../styles/images'
import { TEvent } from '../utils/types'

const isEventWithinTenMinutes = (event: TEvent, now: DateTime) => {
    const eventStart = DateTime.fromISO(event.datetime_start)
    const eventEnd = DateTime.fromISO(event.datetime_end)
    return eventStart < now.plus({ minutes: 10 }) && eventEnd > now
}

export default function useMeetingBanners() {
    const date = DateTime.utc()
    const eventBannerLastShownAt = useRef<Map<string, number>>(new Map<string, number>())
    const { toasts } = useToasterStore()
    const { data: notes } = useGetNotes()
    const { mutate: createNote } = useCreateNote()
    const { data: userInfo } = useGetUserInfo()
    const navigate = useNavigate()
    const { data: events } = useEvents(
        {
            startISO: date.startOf('day').toISO(),
            endISO: date.endOf('day').plus({ minutes: 15 }).toISO(),
        },
        'banner'
    )

    const eventsWithinTenMinutes = useMemo(
        () => events?.filter((event) => isEventWithinTenMinutes(event, date)) ?? [],
        [events, date]
    )

    const createMeetingNote = (event: TEvent) => {
        const optimisticId = uuidv4()
        createNote({
            title: event.title || NO_TITLE,
            author: userInfo?.name || 'Anonymous',
            linked_event_id: event.id,
            linked_event_start: event.datetime_start,
            linked_event_end: event.datetime_end,
            optimisticId,
        })
        navigate(`/notes/${optimisticId}`)
        return optimisticId
    }

    useEffect(() => {
        toasts.forEach((toast) => {
            const eventIds = eventsWithinTenMinutes.map((event) => `${event.id}-banner`)
            if (!eventIds.includes(toast.id)) {
                hotToast.dismiss(toast.id)
                eventBannerLastShownAt.current.delete(toast.id)
            }
        })

        eventsWithinTenMinutes.forEach((event) => {
            const timeUntilEvent = Math.ceil(
                (new Date(event.datetime_start).getTime() - new Date().getTime()) / 1000 / 60
            )
            const timeUntilEventMessage =
                timeUntilEvent > 0 ? `is in ${timeUntilEvent} ${timeUntilEvent > 1 ? 'minutes' : 'minute'}.` : 'is now.'
            const eventTitle = event.title.length > 0 ? event.title : NO_TITLE
            const lastShownAt = eventBannerLastShownAt.current.get(`${event.id}-banner`)
            const previewToastArgs: ToastArgs = {
                toastId: `${event.id}-banner`,
                title: eventTitle,
                duration: Infinity,
            }
            if (event.conference_call.url) {
                previewToastArgs.actions = [
                    {
                        styleType: 'secondary',
                        icon: event.conference_call?.logo,
                        value: 'Join',
                        onClick: () => window.open(event.conference_call?.url, '_blank'),
                    },
                ]
            } else if (event.deeplink) {
                previewToastArgs.actions = [
                    {
                        styleType: 'secondary',
                        icon: icons.external_link,
                        value: 'Open',
                        onClick: () => window.open(event.deeplink, '_blank'),
                    },
                ]
            }
            if ((event.conference_call.url || event.deeplink) && Array.isArray(previewToastArgs.actions)) {
                previewToastArgs.actions.push({
                    styleType: 'secondary',
                    icon: icons.note,
                    value: 'Notes',
                    onClick: () => {
                        if (event.linked_note_id) {
                            navigate(`/notes/${event.linked_note_id}`)
                            return
                        }
                        const note = notes?.find((n) => n.linked_event_id === event.id && !n.is_deleted)
                        const id = note ? note.id : createMeetingNote(event)
                        event.linked_note_id = id
                        navigate(`/notes/${id}`)
                    },
                })
            }

            if (toasts.find((toast) => toast.id === `${event.id}-banner` && toast.visible)) {
                toast(timeUntilEventMessage, previewToastArgs)
                eventBannerLastShownAt.current.set(`${event.id}-banner`, timeUntilEvent)
            } else {
                if (lastShownAt === undefined || (lastShownAt > timeUntilEvent && [0, 1, 5].includes(timeUntilEvent))) {
                    toast(timeUntilEventMessage, previewToastArgs)
                    eventBannerLastShownAt.current.set(`${event.id}-banner`, timeUntilEvent)
                }
            }
        })
    }, [eventsWithinTenMinutes, userInfo])

    useKeyboardShortcut(
        'joinCurrentMeeting',
        useCallback(() => {
            const currentMeetings = eventsWithinTenMinutes.filter(
                (event) => isEventWithinTenMinutes(event, DateTime.utc()) && event.conference_call?.url
            )
            if (!currentMeetings || currentMeetings.length === 0) return
            currentMeetings.sort((a, b) => +DateTime.fromISO(b.datetime_start) - +DateTime.fromISO(a.datetime_start))
            window.open(currentMeetings[0].conference_call.url, '_blank')
        }, [eventsWithinTenMinutes]),
        !eventsWithinTenMinutes.find((event) => isEventWithinTenMinutes(event, DateTime.utc()))?.conference_call.url
    )
}
