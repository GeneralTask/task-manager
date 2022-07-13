import { castImmutable } from "immer"
import { useQuery } from "react-query"
import apiClient from "../../utils/api"
import { TRepository } from "../../utils/types"

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