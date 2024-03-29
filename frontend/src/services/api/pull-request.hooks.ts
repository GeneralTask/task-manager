import { QueryFunctionContext, useQuery } from 'react-query'
import { castImmutable } from 'immer'
import { PR_REFETCH_INTERVAL } from '../../constants'
import apiClient from '../../utils/api'
import { TRepository } from '../../utils/types'
import { getBackgroundQueryOptions, useGTQueryClient } from '../queryUtils'

export const useGetPullRequests = () => {
    return useQuery<TRepository[]>('pull_requests', getPullRequests)
}
const getPullRequests = async () => {
    try {
        const res = await apiClient.get('/pull_requests/')
        return castImmutable(res.data)
    } catch {
        throw 'getPullRequests failed'
    }
}

export const useFetchPullRequests = () => {
    const queryClient = useGTQueryClient()
    return useQuery('fetch_pull_requests', fetchPullRequests, {
        onSettled: () => {
            queryClient.invalidateQueries('pull_requests')
            queryClient.invalidateQueries('overview')
        },
        ...getBackgroundQueryOptions(PR_REFETCH_INTERVAL),
    })
}
const fetchPullRequests = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/pull_requests/fetch/', { signal })
        return castImmutable(res.data)
    } catch {
        throw 'fetchPullRequests failed'
    }
}
