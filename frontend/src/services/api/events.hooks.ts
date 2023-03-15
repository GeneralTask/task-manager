import { useCallback, useEffect, useMemo, useRef } from 'react'
import { QueryFunctionContext, useQuery } from 'react-query'
import produce, { castImmutable } from 'immer'
import { DateTime } from 'luxon'
import { useCalendarContext } from '../../components/calendar/CalendarContext'
import { EVENTS_REFETCH_INTERVAL } from '../../constants'
import useQueryContext from '../../context/QueryContext'
import { useGTLocalStorage, useSetting } from '../../hooks'
import { TLogoImage } from '../../styles/images'
import apiClient from '../../utils/api'
import { TCalendar, TCalendarAccount, TEvent, TOverviewView, TPullRequest, TTaskV4 } from '../../utils/types'
import { getBackgroundQueryOptions, useGTMutation, useGTQueryClient } from '../queryUtils'

interface TEventAttendee {
    name: string
    email: string
}

interface TCreateEventPayload {
    account_id: string
    calendar_id?: string
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
    pr_id?: string
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
    linkedTask?: TTaskV4
    linkedView?: TOverviewView
    linkedPullRequest?: TPullRequest
    optimisticId: string
}
interface TCreateEventResponse {
    id: string
}
interface TModifyEventPayload {
    account_id: string
    calendar_id: string
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

interface TGetEventParams {
    id?: string
}

export const useGetEvent = (params: TGetEventParams) => {
    return useQuery<TEvent>(['events', params.id], (context) => getEvent(params, context), {
        ...getBackgroundQueryOptions(),
        enabled: !!params.id,
    })
}
const getEvent = async ({ id }: TGetEventParams, { signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get(`/events/${id}/`, { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('getEvent failed')
    }
}
const useGetEvents = (params: { startISO: string; endISO: string }, calendarType: 'calendar' | 'banner') => {
    const queryClient = useGTQueryClient()
    return useQuery<TEvent[]>(
        ['events', calendarType, params.startISO],
        (queryFunctionContext) => getEvents(params, queryFunctionContext),
        {
            ...getBackgroundQueryOptions(EVENTS_REFETCH_INTERVAL),
            onSettled: () => {
                // because we only refetch calendars when we refetch events
                queryClient.invalidateQueries(['calendars'])
                queryClient.invalidateQueries(['meeting_preparation_tasks'])
            },
        }
    )
}

export const getEvents = async (
    params: { startISO: string; endISO: string },
    { signal }: { signal?: AbortSignal } = {}
) => {
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

    return useGTMutation(({ createEventPayload }: TCreateEventParams) => createEvent(createEventPayload), {
        tag: 'events',
        invalidateTagsOnSettled: ['events'],
        onMutate: ({
            createEventPayload,
            date,
            linkedTask,
            linkedView,
            linkedPullRequest,
            optimisticId,
        }: TCreateEventParams) => {
            const { events, blockStartTime } = queryClient.getCurrentEvents(
                date,
                createEventPayload.datetime_start,
                createEventPayload.datetime_end
            )
            if (!events) return

            // temporarily select the first calendar of the primary account
            const calendar = selectedCalendars.find((calendar) => calendar.account_id === createEventPayload.account_id)
                ?.calendars[0]

            let logo: TLogoImage
            if (linkedTask?.source.logo) {
                logo = linkedTask?.source.logo
            } else if (linkedPullRequest) {
                logo = 'github'
            } else {
                logo = 'gcal'
            }

            const newEvent: TEvent = {
                id: optimisticId,
                optimisticId: optimisticId,
                title: createEventPayload.summary ?? '',
                body: createEventPayload.description ?? '',
                account_id: createEventPayload.account_id,
                calendar_id: createEventPayload.calendar_id ?? calendar?.calendar_id ?? '',
                color_id: '',
                logo: logo,
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
                linked_pull_request_id: linkedPullRequest?.id ?? '',
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
    const useMutationResult = useGTMutation((data: TDeleteEventData) => deleteEvent(data.id), {
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

    return useGTMutation((data: TModifyEventData) => modifyEvent(data), {
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
    const { field_value: taskToCalAccount, updateSetting: setTaskToCalAccount } = useSetting(
        'calendar_account_id_for_new_tasks'
    )
    const { field_value: taskToCalCalendar, updateSetting: setTaskToCalCalendar } = useSetting(
        'calendar_calendar_id_for_new_tasks'
    )

    // update selected calendars when calendar accounts are added/removed
    useEffect(() => {
        if (!calendars) return

        let hasChanged = true
        const newSelectedCalendars = produce(selectedCalendars, (draft) => {
            // if account scopes change, consider the account both added and removed so we remove all existing selected accounts and re-add them
            const newAccounts = calendars.filter((calendar) => {
                const selectedAccount = selectedCalendars.find(
                    (selectedCalendar) => selectedCalendar.account_id === calendar.account_id
                )
                return (
                    !selectedAccount ||
                    selectedAccount.has_primary_calendar_scopes !== calendar.has_primary_calendar_scopes ||
                    selectedAccount.has_multical_scopes !== calendar.has_multical_scopes
                )
            })

            const removedAccounts = selectedCalendars.filter((selectedCalendar) => {
                const calendar = calendars.find((calendar) => selectedCalendar.account_id === calendar.account_id)
                return (
                    !calendar ||
                    calendar.has_primary_calendar_scopes !== selectedCalendar.has_primary_calendar_scopes ||
                    calendar.has_multical_scopes !== selectedCalendar.has_multical_scopes
                )
            })

            if (!newAccounts.length && !removedAccounts.length) {
                hasChanged = false
                return
            }

            removedAccounts.forEach((removedAccount) => {
                const index = draft.findIndex(
                    (newSelectedCalendar) => newSelectedCalendar.account_id === removedAccount.account_id
                )
                draft.splice(index, 1)
            })
            // when a new account is added, select all calendars
            newAccounts.forEach((account) => {
                draft.push({
                    ...account,
                    calendars: account.calendars.filter((calendar) => calendar.access_role === 'owner'),
                })
            })
        })
        if (hasChanged) {
            setSelectedCalendars(newSelectedCalendars)
        }
    }, [calendars, selectedCalendars])

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

    const toggleCalendarSelection = useCallback(
        (accountId: string, calendar: TCalendar) => {
            const newSelectedCalendars = produce(selectedCalendars, (draft) => {
                const accountIdx = draft.findIndex((account) => account.account_id === accountId)
                if (accountIdx === -1) return

                const calendarIdx = draft[accountIdx].calendars.findIndex((c) => c.calendar_id === calendar.calendar_id)
                if (calendarIdx === -1) {
                    draft[accountIdx].calendars.push({ ...calendar })
                } else {
                    draft[accountIdx].calendars.splice(calendarIdx, 1)
                }
            })
            setSelectedCalendars(newSelectedCalendars)
        },
        [selectedCalendars]
    )

    useEffect(() => {
        // ensure that task-to-cal calendar is always selected
        if (!isCalendarSelected(taskToCalAccount, taskToCalCalendar)) {
            const calendar = calendars
                ?.find((account) => account.account_id === taskToCalAccount)
                ?.calendars.find((calendar) => calendar.calendar_id === taskToCalCalendar)
            if (calendar) {
                toggleCalendarSelection(taskToCalAccount, calendar)
            }
        }

        // if the first account is added, select the first calendar
        if (taskToCalAccount === '' && calendars && calendars.length !== 0) {
            setTaskToCalAccount(calendars[0].account_id)
            setTaskToCalCalendar(calendars[0].account_id)
        }
    }, [calendars, isCalendarSelected, taskToCalAccount, taskToCalCalendar, toggleCalendarSelection])

    return { selectedCalendars, isCalendarSelected, toggleCalendarSelection }
}

// wrapper around useGetEvents that filters out events that are not in the selected calendars
export const useEvents = (params: { startISO: string; endISO: string }, calendarType: 'calendar' | 'banner') => {
    const { data: events, ...rest } = useGetEvents(params, calendarType)
    const { selectedCalendars, isCalendarSelected } = useSelectedCalendars()
    const filteredEvents = useMemo(() => {
        if (!events || selectedCalendars.length === 0) return events
        return events.filter((event) => isCalendarSelected(event.account_id, event.calendar_id))
    }, [events, selectedCalendars, isCalendarSelected])
    return { data: filteredEvents, ...rest }
}
