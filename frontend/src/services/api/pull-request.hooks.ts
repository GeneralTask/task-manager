import { castImmutable } from "immer"
import { useQuery } from "react-query"
import { PR_REFETCH_INTERVAL } from "../../constants"
import apiClient from "../../utils/api"
import { TRepository } from "../../utils/types"
import { useGTQueryClient } from "../queryUtils"

export const useGetPullRequests = () => {
    return useQuery<TRepository[]>('pull_requests', getPullRequests)
}
const getPullRequests = async () => {
    try {
        const res = await apiClient.get('/pull_requests/')
        return castImmutable(res.data)
    } catch {
        throw new Error('getPullRequests failed')
    }
}

export const useFetchPullRequests = () => {
    const queryClient = useGTQueryClient()
    return useQuery('fetch_pull_requests', fetchPullRequests, {
        onSettled: () => {
            queryClient.invalidateQueries('pull_requests')
        },
        refetchInterval: PR_REFETCH_INTERVAL * 1000,
    })
}
const fetchPullRequests = async () => {
    try {
        const res = await apiClient.get('/pull_requests/fetch/')
        return castImmutable(res.data)
    } catch {
        throw new Error('fetchPullRequests failed')
    }
}
