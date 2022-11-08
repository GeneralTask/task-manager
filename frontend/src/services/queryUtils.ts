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
    // copied from react query types
    // useMutation: <TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(mutationFn: MutationFunction<TData, TVariables>, options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>) => UseMutationResult<TData, TError, TVariables, TContext>;

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

interface MutationOptions<TData, TError, TVariables, TContext>
    extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
    tag: QueryKey
    invalidateTagsOnSettled?: QueryKey[]
}

export const useMutationQ = <TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
    mutationFn: MutationFunction<TData, TVariables>,
    mutationOptions: MutationOptions<TData, TError, TVariables, TContext>
) => {
    const queryClient = useGTQueryClient()
    const { getQueryQueue } = useQueryContext()

    const { mutate, ...rest } = useMutation(mutationFn, {
        ...mutationOptions,
        onMutate: emptyFunction,
        onSettled: async (data, error, variables, context) => {
            const queue = getQueryQueue(mutationOptions.tag)
            queue.shift()
            if (queue.length > 0) {
                queue[0]()
            } else {
                mutationOptions.invalidateTagsOnSettled?.forEach((tag) => queryClient.invalidateQueries(tag))
            }
            mutationOptions.onSettled?.(data, error, variables, context)
        },
    })
    const newMutate = (variables: TVariables) => {
        mutationOptions.onMutate?.(variables)
        const queue = getQueryQueue(mutationOptions.tag)
        queue.push(() => mutate(variables))
        if (queue.length === 1) {
            mutate(variables)
        }
    }
    return {
        ...rest,
        mutate: newMutate,
    }
}
