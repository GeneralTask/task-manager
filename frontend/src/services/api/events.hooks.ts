import { useCallback, useEffect, useMemo, useRef } from 'react'
import { QueryFunctionContext, useQuery } from 'react-query'
import produce, { castImmutable } from 'immer'
import { DateTime } from 'luxon'
import { useCalendarContext } from '../../components/calendar/CalendarContext'
import { EVENTS_REFETCH_INTERVAL } from '../../constants'
import useQueryContext from '../../context/QueryContext'
import { useGTLocalStorage, usePreviewMode } from '../../hooks'
import apiClient from '../../utils/api'
import { TCalendar, TCalendarAccount, TEvent, TOverviewView, TTask } from '../../utils/types'
import { getBackgroundQueryOptions, useGTQueryClient, useQueuedMutation } from '../queryUtils'

interface TEventAttendee {
    name: string
    email: string
}

interface TCreateEventPayload {
    account_id: string
    datetime_start: string
    datetime_end: string
    summary?: string
    location?: string
    description?: string
    time_zone?: string
    attendees?: TEventAttendee[]
    add_conference_call?: boolean
    task_id?: string
    view_id?: string
}
interface TModifyEventPayload {
    account_id: string
    datetime_start?: string
    datetime_end?: string
    summary?: string
    location?: string
    description?: string
    time_zone?: string
    attendees?: TEventAttendee[]
    add_conference_call?: boolean
}
interface TCreateEventParams {
    createEventPayload: TCreateEventPayload
    date: DateTime
    linkedTask?: TTask
    linkedView?: TOverviewView
    optimisticId: string
}
interface TCreateEventResponse {
    id: string
}
interface TModifyEventPayload {
    account_id: string
    datetime_start?: string
    datetime_end?: string
    summary?: string
    location?: string
    description?: string
    time_zone?: string
    attendees?: TEventAttendee[]
    add_conference_call?: boolean
}
interface TModifyEventData {
    id: string
    event: TEvent
    payload: TModifyEventPayload
    date: DateTime
}

interface TDeleteEventData {
    id: string
    date: DateTime
    datetime_start: string
    datetime_end: string
}

export const useGetEvents = (params: { startISO: string; endISO: string }, calendarType: 'calendar' | 'banner') => {
    return useQuery<TEvent[]>(
        ['events', calendarType, params.startISO],
        (queryFunctionContext) => getEvents(params, queryFunctionContext),
        getBackgroundQueryOptions(EVENTS_REFETCH_INTERVAL)
    )
}
const getEvents = async (params: { startISO: string; endISO: string }, { signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/events/', {
            params: { datetime_start: params.startISO, datetime_end: params.endISO },
            signal,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('getEvents failed')
    }
}

export const useCreateEvent = () => {
    const queryClient = useGTQueryClient()
    const { selectedEvent, setSelectedEvent } = useCalendarContext()
    const { setOptimisticId } = useQueryContext()
    const { selectedCalendars } = useSelectedCalendars()

    // Keep selectedEvent in a ref so that it can be accessed in can be updated in the onSuccess callback
    const selectedEventRef = useRef(selectedEvent)
    useEffect(() => {
        selectedEventRef.current = selectedEvent
    }, [selectedEvent])

    return useQueuedMutation(({ createEventPayload }: TCreateEventParams) => createEvent(createEventPayload), {
        tag: 'events',
        invalidateTagsOnSettled: ['events'],
        onMutate: ({ createEventPayload, date, linkedTask, linkedView, optimisticId }: TCreateEventParams) => {
            const { events, blockStartTime } = queryClient.getCurrentEvents(
                date,
                createEventPayload.datetime_start,
                createEventPayload.datetime_end
            )
            if (!events) return

            // temporarily select the first calendar of the primary account
            const calendarId =
                selectedCalendars.find((calendar) => calendar.account_id === createEventPayload.account_id)
                    ?.calendars[0]?.calendar_id ?? ''

            const newEvent: TEvent = {
                id: optimisticId,
                optimisticId: optimisticId,
                title: createEventPayload.summary ?? '',
                body: createEventPayload.description ?? '',
                account_id: createEventPayload.account_id,
                calendar_id: calendarId,
                logo: linkedTask?.source.logo_v2 ?? 'gcal',
                deeplink: '',
                datetime_start: createEventPayload.datetime_start,
                datetime_end: createEventPayload.datetime_end,
                can_modify: true,
                conference_call: {
                    url: '',
                    logo: '',
                    platform: '',
                },
                linked_task_id: linkedTask?.id ?? '',
                linked_view_id: linkedView?.id ?? '',
            }

            const newEvents = produce(events, (draft) => {
                draft.push(newEvent)
            })
            queryClient.setQueryData(['events', 'calendar', blockStartTime], newEvents)
        },
        onSuccess: ({ id }: TCreateEventResponse, { createEventPayload, date, optimisticId }: TCreateEventParams) => {
            setOptimisticId(optimisticId, id)

            const { events, blockStartTime } = queryClient.getCurrentEvents(
                date,
                createEventPayload.datetime_start,
                createEventPayload.datetime_end
            )
            if (!events) return

            const eventIndex = events.findIndex((event) => event.id === optimisticId)
            if (eventIndex === -1) return
            const newEvents = produce(events, (draft) => {
                draft[eventIndex].id = id
                draft[eventIndex].optimisticId = undefined
            })

            queryClient.setQueryData(['events', 'calendar', blockStartTime], newEvents)

            // if this event is selected, update the selectedEvent to the actual event ID
            if (selectedEventRef.current?.id === optimisticId) {
                setSelectedEvent(newEvents[eventIndex])
            }
        },
    })
}
const createEvent = async (data: TCreateEventPayload) => {
    try {
        const res = await apiClient.post('/events/create/gcal/', data)
        return castImmutable(res.data)
    } catch {
        throw new Error('createEvent failed')
    }
}

export const useDeleteEvent = () => {
    const queryClient = useGTQueryClient()
    const useMutationResult = useQueuedMutation((data: TDeleteEventData) => deleteEvent(data.id), {
        tag: 'events',
        invalidateTagsOnSettled: ['events'],
        onMutate: (data: TDeleteEventData) => {
            const { events, blockStartTime } = queryClient.getCurrentEvents(
                data.date,
                data.datetime_start,
                data.datetime_end
            )
            if (!events) return

            const newEvents = produce(events, (draft) => {
                const eventIdx = draft.findIndex((event) => event.id === data.id)
                if (eventIdx === -1) return
                draft.splice(eventIdx, 1)
            })
            queryClient.setQueryData(['events', 'calendar', blockStartTime], newEvents)
        },
    })
    const deleteEventInCache = (data: TDeleteEventData) => {
        const { events, blockStartTime } = queryClient.getCurrentEvents(
            data.date,
            data.datetime_start,
            data.datetime_end
        )
        if (!events) return
        const newEvents = produce(events, (draft) => {
            const eventIdx = draft.findIndex((event) => event.id === data.id)
            if (eventIdx === -1) return
            draft.splice(eventIdx, 1)
        })
        queryClient.setQueryData(['events', 'calendar', blockStartTime], newEvents)
    }
    const undoDeleteEventInCache = (event: TEvent, date: DateTime) => {
        const { events, blockStartTime } = queryClient.getCurrentEvents(date, event.datetime_start, event.datetime_end)
        if (!events) return

        const newEvents = produce(events, (draft) => {
            draft.push(event)
        })
        queryClient.setQueryData(['events', 'calendar', blockStartTime], newEvents)
    }
    return { ...useMutationResult, deleteEventInCache, undoDeleteEventInCache }
}
const deleteEvent = async (eventId: string) => {
    try {
        const res = await apiClient.delete(`/events/delete/${eventId}/`)
        return castImmutable(res.data)
    } catch {
        throw new Error('deleteEvent failed')
    }
}

export const useModifyEvent = () => {
    const queryClient = useGTQueryClient()

    return useQueuedMutation((data: TModifyEventData) => modifyEvent(data), {
        tag: 'events',
        invalidateTagsOnSettled: ['events'],
        onMutate: ({ event, payload, date }: TModifyEventData) => {
            const { events, blockStartTime } = queryClient.getCurrentEvents(
                date,
                event.datetime_start,
                event.datetime_end
            )
            if (!events) return

            const eventIdx = events.findIndex((e) => e.id === event.id)
            if (eventIdx === -1) return

            const newEvents = produce(events, (draft) => {
                const eventInCache = draft[eventIdx]
                if (payload.summary) eventInCache.title = payload.summary
                if (payload.description) eventInCache.body = payload.description
                // remove milliseconds from date string to match time format provided by server
                if (payload.datetime_start) eventInCache.datetime_start = payload.datetime_start.replace('.000', '')
                if (payload.datetime_end) eventInCache.datetime_end = payload.datetime_end
                // sort events so that ordering matches that of server
                draft.sort((a, b) => {
                    if (a.datetime_start === b.datetime_start) {
                        return a.id.localeCompare(b.id)
                    } else {
                        return a.datetime_start.localeCompare(b.datetime_start)
                    }
                })
            })
            queryClient.setQueryData(['events', 'calendar', blockStartTime], newEvents)
        },
    })
}

const modifyEvent = async (data: TModifyEventData) => {
    try {
        const res = await apiClient.patch(`/events/modify/${data.id}/`, data.payload)
        return castImmutable(res.data)
    } catch {
        throw new Error('modifyEvent failed')
    }
}

export const useGetCalendars = () => {
    return useQuery<TCalendarAccount[]>('calendars', getCalendars, getBackgroundQueryOptions(EVENTS_REFETCH_INTERVAL))
}
const getCalendars = async () => {
    try {
        const res = await apiClient.get('/calendars/')
        return castImmutable(res.data)
    } catch {
        throw new Error('getCalendars failed')
    }
}

export const useSelectedCalendars = () => {
    const { data: calendars } = useGetCalendars()
    const [selectedCalendars, setSelectedCalendars] = useGTLocalStorage<TCalendarAccount[]>(
        'selectedCalendars',
        [],
        true
    )

    // update selected calendars when calendar accounts are added/removed
    useEffect(() => {
        if (!calendars) return

        const newAccounts = calendars.filter(
            (calendar) =>
                !selectedCalendars.find((selectedCalendar) => selectedCalendar.account_id === calendar.account_id)
        )

        const removedAccounts = selectedCalendars.filter(
            (selectedCalendar) => !calendars.find((calendar) => calendar.account_id === selectedCalendar.account_id)
        )

        if (!newAccounts.length && !removedAccounts.length) return

        const newSelectedCalendars = [...selectedCalendars]
        // when a new account is added, select the primary calendar
        newAccounts.forEach((account) => {
            const primaryCalendar = account.calendars.find(
                (calendar) => calendar.calendar_id === account.account_id || calendar.calendar_id === 'primary'
            )
            if (primaryCalendar)
                newSelectedCalendars.push({
                    ...account,
                    calendars: [primaryCalendar],
                })
        })
        removedAccounts.forEach((removedAccount) => {
            const index = newSelectedCalendars.findIndex(
                (newSelectedCalendar) => newSelectedCalendar.account_id === removedAccount.account_id
            )
            newSelectedCalendars.splice(index, 1)
        })
        setSelectedCalendars(newSelectedCalendars)
    }, [calendars])

    const lookupTable: Map<string, Set<string>> = useMemo(() => {
        return new Map(
            selectedCalendars.map((account) => [
                account.account_id,
                new Set(account.calendars.map((calendar) => calendar.calendar_id)),
            ])
        )
    }, [selectedCalendars])

    // used to check if a calendar is selected in O(1) time
    const isCalendarSelected = useCallback(
        (accountId: string, calendarId: string) => lookupTable.get(accountId)?.has(calendarId) ?? false,
        [lookupTable]
    )

    const toggleCalendar = useCallback((accountId: string, calendar: TCalendar) => {
        const newSelectedCalendars = [...selectedCalendars]
        const accountIdx = newSelectedCalendars.findIndex((account) => account.account_id === accountId)
        if (accountIdx === -1) return

        const calendarIdx = newSelectedCalendars[accountIdx].calendars.findIndex(
            (c) => c.calendar_id === calendar.calendar_id
        )
        if (calendarIdx === -1) {
            newSelectedCalendars[accountIdx].calendars.push(calendar)
        } else {
            newSelectedCalendars[accountIdx].calendars.splice(calendarIdx, 1)
        }
        setSelectedCalendars(newSelectedCalendars)
    }, [])

    return { selectedCalendars, isCalendarSelected, toggleCalendar }
}

// wrapper around useGetEvents that filters out events that are not in the selected calendars
export const useEvents = (params: { startISO: string; endISO: string }, calendarType: 'calendar' | 'banner') => {
    const { isPreviewMode } = usePreviewMode()
    const { data: events, ...rest } = useGetEvents(params, calendarType)
    const { selectedCalendars, isCalendarSelected } = useSelectedCalendars()
    const filteredEvents = useMemo(() => {
        if (!events || selectedCalendars.length === 0) return events
        if (!isPreviewMode) {
            return events.filter((event) => event.calendar_id === event.account_id || event.calendar_id === 'primary')
        }
        return events.filter((event) => isCalendarSelected(event.account_id, event.calendar_id))
    }, [events, selectedCalendars, isPreviewMode, isCalendarSelected])
    return { data: filteredEvents, ...rest }
}
