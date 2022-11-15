import { MutationFunction, QueryClient, QueryKey, UseMutationOptions, useMutation, useQueryClient } from 'react-query'
import { QueryFilters } from 'react-query/types/core/utils'
import { Immutable } from 'immer'
import { DateTime } from 'luxon'
import useQueryContext from '../context/QueryContext'
import { getMonthsAroundDate } from '../utils/time'
import { TEvent } from '../utils/types'
import { emptyFunction } from '../utils/utils'

/**
 * Wrapper for useQueryClient that adds getImmutableQueryData method
 * getImmutableQueryData simply casts the result as Immutable so the editor disallows direct assignment
 */
interface GTQueryClient extends QueryClient {
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
    invalidateTagsOnSettled?: QueryKey[]
}

export const useQueuedMutation = <TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
    mutationFn: MutationFunction<TData, TVariables>,
    mutationOptions: MutationOptions<TData, TError, TVariables, TContext>
) => {
    const queryClient = useGTQueryClient()
    const { getQueryQueue, getIdFromOptimisticId } = useQueryContext()

    const { mutate, ...rest } = useMutation(mutationFn, {
        ...mutationOptions,
        onMutate: emptyFunction,
        onSettled: (data, error, variables, context) => {
            const queue = getQueryQueue(mutationOptions.tag)
            queue.shift()
            if (queue.length > 0) {
                if (queue[0].optimisticId) {
                    const id = getIdFromOptimisticId(queue[0].optimisticId)
                    queue[0].send(id)
                } else {
                    queue[0].send()
                }
            } else {
                mutationOptions.invalidateTagsOnSettled?.forEach((tag) => queryClient.invalidateQueries(tag))
            }
            mutationOptions.onSettled?.(data, error, variables, context)
        },
    })
    const newMutate = (variables: TVariables, optimisticId?: string | false) => {
        mutationOptions.onMutate?.(variables)
        const queue = getQueryQueue(mutationOptions.tag)

        if (optimisticId) {
            if (queue.length === 1) {
                throw new Error(`Optimistic mutation queued with no pending requests with tag: ${mutationOptions.tag}`)
            } else {
                queue.push({
                    send: (id?: string) => mutate({ ...variables, id }),
                    optimisticId,
                })
            }
        } else {
            queue.push({
                send: () => mutate(variables),
            })
            if (queue.length === 1) {
                mutate(variables)
            }
        }
    }
    return {
        ...rest,
        mutate: newMutate,
    }
}
