import { QueryClient, QueryKey, useQueryClient } from 'react-query'
import { QueryFilters } from 'react-query/types/core/utils'
import { Immutable } from 'immer'

/**
 * Wrapper for useQueryClient that adds getImmutableQueryData method
 * getImmutableQueryData simply casts the result as Immutable so the editor disallows direct assignment
 */
interface GTQueryClient extends QueryClient {
    getImmutableQueryData: <TData = unknown>(queryKey: QueryKey, filters?: QueryFilters) => Immutable<TData> | undefined
}
export const useGTQueryClient = (): GTQueryClient => {
    const queryClient = useQueryClient() as GTQueryClient

    queryClient.getImmutableQueryData = <TData = unknown>(
        queryKey: QueryKey,
        filters?: QueryFilters
    ): Immutable<TData> | undefined => queryClient.getQueryData(queryKey, filters)

    return queryClient
}
