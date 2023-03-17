import { QueryFunctionContext, useQuery } from 'react-query'
import { castImmutable } from 'immer'
import { TDashboard } from '../../components/superDashboard/types'
import apiClient from '../../utils/api'

export const useGetDashboardData = () => {
    return useQuery<TDashboard>('dashboard', getDashboardData)
}

const getDashboardData = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get(`/dashboard/data/`, { signal })
        return castImmutable(res.data)
    } catch {
        throw 'getDashboardData failed'
    }
}
