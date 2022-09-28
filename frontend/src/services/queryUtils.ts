import { QueryClient, QueryKey, useQueryClient } from 'react-query'
import { QueryFilters } from 'react-query/types/core/utils'
import { Immutable } from 'immer'
import { DateTime } from 'luxon'
import { getMonthsAroundDate } from '../utils/time'
import { TEvent } from '../utils/types'

/**
 * Wrapper for useQueryClient that adds getImmutableQueryData method
 * getImmutableQueryData simply casts the result as Immutable so the editor disallows direct assignment
 */
interface GTQueryClient extends QueryClient {
    getImmutableQueryData: <TData = unknown>(queryKey: QueryKey, filters?: QueryFilters) => Immutable<TData> | undefined
    getCurrentEvents: (date: DateTime, datetime_start: string, datetime_end: string) => { events?: Immutable<TEvent[]>, blockStartTime: string }
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
