import { TEvent, TTask } from "../../utils/types"
import produce, { castImmutable } from "immer"
import { QueryFunctionContext, useMutation, useQuery } from "react-query"

import { DateTime } from "luxon"
import apiClient from "../../utils/api"
import { getMonthsAroundDate } from "../../utils/time"
import { useGTQueryClient } from "../queryUtils"
import { v4 as uuidv4 } from 'uuid'
import { EVENTS_REFETCH_INTERVAL } from "../../constants"

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
    event: TEvent
    payload: TModifyEventPayload
    date: DateTime
}
interface CreateEventParams {
    createEventPayload: TCreateEventPayload
    date: DateTime
    linkedTask?: TTask
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
    return useQuery<TEvent[]>(['events', calendarType, params.startISO], (queryFunctionContext) => getEvents(params, queryFunctionContext), {
        refetchInterval: EVENTS_REFETCH_INTERVAL * 1000,
        refetchIntervalInBackground: true,
    })
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
    return useMutation(({ createEventPayload }: CreateEventParams) => createEvent(createEventPayload),
        {
            onMutate: async ({ createEventPayload, date, linkedTask }: CreateEventParams) => {
                await queryClient.cancelQueries('events')

                const start = DateTime.fromISO(createEventPayload.datetime_start)
                const end = DateTime.fromISO(createEventPayload.datetime_end)
                const timeBlocks = getMonthsAroundDate(date, 1)
                const blockIndex = timeBlocks.findIndex(block => start >= block.start && end <= block.end)
                const block = timeBlocks[blockIndex]

                const events = queryClient.getImmutableQueryData<TEvent[]>([
                    'events',
                    'calendar',
                    block.start.toISO(),
                ])

                if (events == null) return

                const newEvent: TEvent = {
                    id: uuidv4(),
                    title: createEventPayload.summary ?? '',
                    body: createEventPayload.description ?? '',
                    account_id: createEventPayload.account_id,
                    logo: linkedTask?.source.logo_v2 ?? 'gcal',
                    deeplink: '',
                    datetime_start: createEventPayload.datetime_start,
                    datetime_end: createEventPayload.datetime_end,
                    can_modify: false,
                    conference_call: {
                        url: '',
                        logo: '',
                        platform: '',
                    },
                    linked_task_id: linkedTask?.id ?? '',
                }

                const newEvents = produce(events, (draft) => {
                    draft.push(newEvent)
                })
                queryClient.setQueryData([
                    'events',
                    'calendar',
                    block.start.toISO(),
                ], newEvents)
            },
            onSettled: () => {
                queryClient.invalidateQueries('events')
            }
        }
    )
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
    const getCurrentEvents = (date: DateTime, datetime_start: string, datetime_end: string) => {
        const start = DateTime.fromISO(datetime_start)
        const end = DateTime.fromISO(datetime_end)
        const timeBlocks = getMonthsAroundDate(date, 1)
        const blockIndex = timeBlocks.findIndex((block) => start >= block.start && end <= block.end)
        const block = timeBlocks[blockIndex]
        const blockStartTime = block.start.toISO()
        queryClient.cancelQueries(['events', 'calendar', blockStartTime])
        return { events: queryClient.getImmutableQueryData<TEvent[]>(['events', 'calendar', block.start.toISO()]), blockStartTime }
    }
    const useMutationResult = useMutation((data: TDeleteEventData) => deleteEvent(data.id), {
        onMutate: async (data: TDeleteEventData) => {
            const { events, blockStartTime } = getCurrentEvents(data.date, data.datetime_start, data.datetime_end)
            if (!events) return

            const newEvents = produce(events, (draft) => {
                const eventIdx = draft.findIndex((event) => event.id === data.id)
                if (eventIdx === -1) return
                draft.splice(eventIdx, 1)
            })
            queryClient.setQueryData(['events', 'calendar', blockStartTime], newEvents)
        },
        onSettled: () => {
            queryClient.invalidateQueries('events')
        },
    })
    const deleteEventInCache = (data: TDeleteEventData) => {
        const { events, blockStartTime } = getCurrentEvents(data.date, data.datetime_start, data.datetime_end)
        if (!events) return
        const newEvents = produce(events, (draft) => {
            const eventIdx = draft.findIndex((event) => event.id === data.id)
            if (eventIdx === -1) return
            draft.splice(eventIdx, 1)
        })
        queryClient.setQueryData(['events', 'calendar', blockStartTime], newEvents)
    }
    const undoDeleteEventInCache = (event: TEvent, date: DateTime) => {
        const { events, blockStartTime } = getCurrentEvents(date, event.datetime_start, event.datetime_end)
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

    return useMutation((data: TModifyEventData) => modifyEvent(data), {
        onMutate: async ({ event, payload, date }: TModifyEventData) => {
            await queryClient.cancelQueries('events')

            const start = DateTime.fromISO(event.datetime_start)
            const end = DateTime.fromISO(event.datetime_end)
            const timeBlocks = getMonthsAroundDate(date, 1)
            const blockIndex = timeBlocks.findIndex((block) => start >= block.start && end <= block.end)
            const block = timeBlocks[blockIndex]

            const events = queryClient.getImmutableQueryData<TEvent[]>(['events', 'calendar', block.start.toISO()])
            if (!events) return

            const eventIdx = events.findIndex(e => e.id === event.id)
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
            queryClient.setQueryData(['events', 'calendar', block.start.toISO()], newEvents)
        },
        onSettled: () => {
            queryClient.invalidateQueries('events')
        },
    })
}

const modifyEvent = async (data: TModifyEventData) => {
    try {
        const res = await apiClient.patch(`/events/modify/${data.event.id}/`, data.payload)
        return castImmutable(res.data)
    } catch {
        throw new Error('modifyEvent failed')
    }
}
