import { useCallback, useRef } from 'react'
import { toast as hotToast, useToasterStore } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { toast as oldToast } from 'react-toastify'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import { useInterval, useKeyboardShortcut, usePreviewMode } from '.'
import Flex from '../components/atoms/Flex'
import GTButton from '../components/atoms/buttons/GTButton'
import ToastTemplate, { ToastTemplateProps } from '../components/atoms/toast/ToastTemplate'
import { ToastArgs, toast } from '../components/molecules/toast/utils'
import { NO_TITLE, SINGLE_SECOND_INTERVAL } from '../constants'
import { useEvents } from '../services/api/events.hooks'
import { useCreateNote, useGetNotes } from '../services/api/notes.hooks'
import { useGetUserInfo } from '../services/api/user-info.hooks'
import { Spacing } from '../styles'
import { icons } from '../styles/images'
import { TEvent } from '../utils/types'

const isEventWithinTenMinutes = (event: TEvent) => {
    const eventStart = DateTime.fromISO(event.datetime_start)
    const eventEnd = DateTime.fromISO(event.datetime_end)
    return eventStart < DateTime.now().plus({ minutes: 10 }) && eventEnd > DateTime.now()
}

export default function useEventBanners(date: DateTime) {
    const eventBannerLastShownAt = useRef<Map<string, number>>(new Map<string, number>())
    const eventsWithinTenMinutes = useRef<TEvent[]>([])
    const { isPreviewMode } = usePreviewMode()
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

    useInterval(
        () => {
            const updatedEvents = events?.filter((event) => isEventWithinTenMinutes(event))
            if (updatedEvents) {
                eventsWithinTenMinutes.current = updatedEvents
            }
            eventBannerLastShownAt.current.forEach((_, id) => {
                if (!eventsWithinTenMinutes.current.map((event) => event.id).includes(id)) {
                    hotToast.dismiss(id)
                    oldToast.dismiss(id)
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

                const toastProps: ToastTemplateProps = {
                    title: eventTitle,
                    message: timeUntilEventMessage,
                    ...(event.conference_call?.url
                        ? {
                              actions: (
                                  <Flex gap={Spacing._8}>
                                      <GTButton
                                          styleType="secondary"
                                          icon={event.conference_call?.logo}
                                          value="Join"
                                          onClick={() => window.open(event.conference_call?.url, '_blank')}
                                      />
                                      <GTButton
                                          styleType="icon"
                                          icon={icons.note}
                                          onClick={() => {
                                              if (event.linked_note_id) {
                                                  navigate(`/notes/${event.linked_note_id}`)
                                                  return
                                              }
                                              const note = notes?.find(
                                                  (n) => n.linked_event_id === event.id && !n.is_deleted
                                              )
                                              const id = note ? note.id : createMeetingNote(event)
                                              event.linked_note_id = id
                                              navigate(`/notes/${id}`)
                                          }}
                                      />
                                  </Flex>
                              ),
                          }
                        : event.deeplink && {
                              actions: (
                                  <Flex gap={Spacing._8}>
                                      <GTButton
                                          styleType="secondary"
                                          icon={icons.external_link}
                                          value="Open"
                                          onClick={() => window.open(event.deeplink, '_blank')}
                                      />
                                      <GTButton
                                          styleType="icon"
                                          icon={icons.note}
                                          onClick={() => {
                                              if (event.linked_note_id) {
                                                  navigate(`/notes/${event.linked_note_id}`)
                                                  return
                                              }
                                              const note = notes?.find(
                                                  (n) => n.linked_event_id === event.id && !n.is_deleted
                                              )
                                              const id = note ? note.id : createMeetingNote(event)
                                              navigate(`/notes/${id}`)
                                          }}
                                      />
                                  </Flex>
                              ),
                          }),
                }
                if (isPreviewMode) {
                    if (toasts.find((toast) => toast.id === event.id)) {
                        toast(timeUntilEventMessage, previewToastArgs)
                        eventBannerLastShownAt.current.set(event.id, timeUntilEvent)
                    } else {
                        if (
                            lastShownAt === undefined ||
                            (lastShownAt > timeUntilEvent && [0, 1, 5].includes(timeUntilEvent))
                        ) {
                            toast(timeUntilEventMessage, previewToastArgs)
                            eventBannerLastShownAt.current.set(event.id, timeUntilEvent)
                        }
                    }
                } else {
                    if (oldToast.isActive(event.id)) {
                        oldToast.update(event.id, { render: <ToastTemplate {...toastProps} /> })
                        eventBannerLastShownAt.current.set(event.id, timeUntilEvent)
                    } else {
                        if (
                            lastShownAt === undefined ||
                            (lastShownAt > timeUntilEvent && [0, 1, 5].includes(timeUntilEvent))
                        ) {
                            oldToast(<ToastTemplate {...toastProps} />, {
                                toastId: `${event.id}-banner`,
                                autoClose: false,
                                closeOnClick: false,
                                theme: 'light',
                            })
                            eventBannerLastShownAt.current.set(event.id, timeUntilEvent)
                        }
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
