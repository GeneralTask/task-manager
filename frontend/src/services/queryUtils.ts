import { MutationFunction, QueryClient, QueryKey, UseMutationOptions, useMutation, useQueryClient } from 'react-query'
import { QueryFilters } from 'react-query/types/core/utils'
import { Immutable } from 'immer'
import { DateTime } from 'luxon'
import { emit } from '../components/molecules/Toast'
import { DEFAULT_BACKGROUND_QUERY_STALE_TIME, QUEUED_MUTATION_DEBOUNCE, TASK_REFETCH_INTERVAL } from '../constants'
import useQueryContext from '../context/QueryContext'
import { usePreviewMode, useToast } from '../hooks'
import { getMonthsAroundDate } from '../utils/time'
import { TEvent } from '../utils/types'
import { emptyFunction, sleep } from '../utils/utils'

/**
 * Wrapper for useQueryClient that adds getImmutableQueryData method
 * getImmutableQueryData simply casts the result as Immutable so the editor disallows direct assignment
 */
export interface GTQueryClient extends QueryClient {
    getImmutableQueryData: <TData = unknown>(queryKey: QueryKey, filters?: QueryFilters) => Immutable<TData> | undefined
    getCurrentEvents: (
        date: DateTime,
        datetime_start: string,
        datetime_end: string
    ) => { events?: Immutable<TEvent[]>; blockStartTime: string }
}
export const useGTQueryClient = (): GTQueryClient => {
    const queryClient = useQueryClient() as GTQueryClient
    queryClient.getImmutableQueryData = <TData = unknown>(
        queryKey: QueryKey,
        filters?: QueryFilters
    ): Immutable<TData> | undefined => queryClient.getQueryData(queryKey, filters)

    queryClient.getCurrentEvents = (date: DateTime, datetime_start: string, datetime_end: string) => {
        const start = DateTime.fromISO(datetime_start)
        const end = DateTime.fromISO(datetime_end)
        const timeBlocks = getMonthsAroundDate(date, 1)
        const blockIndex = timeBlocks.findIndex((block) => start >= block.start && end <= block.end)
        const block = timeBlocks[blockIndex]
        const blockStartTime = block.start.toISO()
        queryClient.cancelQueries(['events', 'calendar', blockStartTime])
        return {
            events: queryClient.getImmutableQueryData<TEvent[]>(['events', 'calendar', block.start.toISO()]),
            blockStartTime,
        }
    }

    return queryClient
}

/**
 * Provides a wrapper around react-query's useMutation that allows mutations to be queued
 * Optimistic updates will be applied immediately via the onMutation callback
 * Mutations will only be sent once all queued mutations have been completed
 * Queues are separated by the tag param - i.e. 'tasks' and 'overview' will get separate queues
 * Once a queue is cleared, the invalidateTagsOnSettled will be invalidated to trigger a refetch
 *
 * Mutations that modify an object MUST include an id field
 * and if the id is waiting to be assigned, then isOptimistic must be passed in as true
 **/
interface MutationOptions<TData, TError, TVariables, TContext>
    extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
    tag: QueryKey
    errorMessage: string
    invalidateTagsOnSettled?: QueryKey[]
}

export const useGTMutation = <TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
    mutationFn: MutationFunction<TData, TVariables>,
    mutationOptions: MutationOptions<TData, TError, TVariables, TContext>,
    useQueueing = true
) => {
    const queryClient = useGTQueryClient()
    const oldToast = useToast()
    const { isPreviewMode } = usePreviewMode()
    const { getQueryQueue, getLastSentQuery, setLastSentQuery, getIdFromOptimisticId } = useQueryContext()

    const { mutate, ...rest } = useMutation(mutationFn, {
        ...mutationOptions,
        onMutate: useQueueing ? emptyFunction : mutationOptions.onMutate,
        onSettled: async (data, error, variables, context) => {
            mutationOptions.onSettled?.(data, error, variables, context)
            const queue = getQueryQueue(mutationOptions.tag)
            const thisRequest = queue.shift()
            if (queue.length > 0) {
                if (queue[0].optimisticId) {
                    const id = getIdFromOptimisticId(queue[0].optimisticId)
                    if (!id) {
                        throw new Error('Could not find real id for optimistic id')
                    }
                    queue[0].send(id)
                } else {
                    queue[0].send()
                }
            } else {
                await sleep(QUEUED_MUTATION_DEBOUNCE)
                // check if another request was sent during the debounce period
                if (getLastSentQuery(mutationOptions.tag) != thisRequest) return
                mutationOptions.invalidateTagsOnSettled?.forEach((tag) => queryClient.invalidateQueries(tag))
            }
        },
        onError: (error, variables, context) => {
            mutationOptions.onError?.(error, variables, context)
            if (isPreviewMode) {
                emit({
                    message: `Failed to ${mutationOptions.errorMessage}: Request failed.`,
                    type: 'error',
                })
            } else {
                oldToast.show(
                    {
                        title: `Failed to ${mutationOptions.errorMessage}:`,
                        message: 'Request failed.',
                    },
                    {
                        autoClose: 4000,
                        pauseOnFocusLoss: false,
                        theme: 'light',
                    }
                )
            }
        },
    })
    const newMutate = (variables: TVariables, optimisticId?: string) => {
        mutationOptions.onMutate?.(variables)
        const queue = getQueryQueue(mutationOptions.tag)

        // if an optimistic ID is passed in, first check if it has already been resolved
        if (optimisticId) {
            const realId = getIdFromOptimisticId(optimisticId)
            if (realId) {
                optimisticId = undefined
                variables = { ...variables, id: realId }
            }
        }

        if (optimisticId) {
            if (queue.length === 0) {
                throw new Error(`Optimistic mutation queued with no pending requests with tag: ${mutationOptions.tag}`)
            } else {
                queue.push({
                    send: (id?: string) => mutate({ ...variables, id }),
                    optimisticId,
                })
            }
        } else {
            const queuedRequest = { send: () => mutate(variables) }
            queue.push(queuedRequest)
            if (queue.length === 1) {
                queuedRequest.send()
                setLastSentQuery(mutationOptions.tag, queuedRequest)
            }
        }
    }
    return {
        ...rest,
        mutate: newMutate,
    }
}

/**
 * If the window is focused, refetch regularly
 * If the window is not focused for more than refetchInterval, refetch when the user returns to the window
 **/
export const getBackgroundQueryOptions = (
    refetchInterval = TASK_REFETCH_INTERVAL,
    staleTime = DEFAULT_BACKGROUND_QUERY_STALE_TIME
) => ({
    staleTime,
    refetchInterval,
    refetchIntervalInBackground: false,
})
