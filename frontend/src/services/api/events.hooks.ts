import { TEvent, TTask } from "../../utils/types"
import produce, { castImmutable } from "immer"
import { useMutation, useQuery } from "react-query"

import { DateTime } from "luxon"
import apiClient from "../../utils/api"
import { getMonthsAroundDate } from "../../utils/time"
import { useGTQueryClient } from "../queryUtils"
import { v4 as uuidv4 } from 'uuid'

export const useGetEvents = (params: { startISO: string; endISO: string }, calendarType: 'calendar' | 'banner') => {
    return useQuery<TEvent[]>(['events', calendarType, params.startISO], () => getEvents(params))
}
const getEvents = async (params: { startISO: string; endISO: string }) => {
    try {
        const res = await apiClient.get('/events/', {
            params: { datetime_start: params.startISO, datetime_end: params.endISO },
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('getEvents failed')
    }
}

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

export interface TModifyEventData {
    id: string
    date: DateTime
    datetime_start: string
    datetime_end: string
}

interface CreateEventParams {
    createEventPayload: TCreateEventPayload
    date: DateTime
    linkedTask?: TTask
    linkedTaskSection?: string
}
export const useCreateEvent = () => {
    const queryClient = useGTQueryClient()
    return useMutation(({ createEventPayload }: CreateEventParams) => createEvent(createEventPayload),
        {
            onMutate: async ({ createEventPayload, date }: CreateEventParams) => {
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
                    logo: 'gcal',
                    deeplink: '',
                    datetime_start: createEventPayload.datetime_start,
                    datetime_end: createEventPayload.datetime_end,
                    conference_call: null,
                    linked_task_id: '',
                    linked_task_deeplink: '',
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
    const useMutationResult = useMutation((data: TModifyEventData) => deleteEvent(data.id), {
        onMutate: async (data: TModifyEventData) => {
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
    const deleteEventInCache = (data: TModifyEventData) => {
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
