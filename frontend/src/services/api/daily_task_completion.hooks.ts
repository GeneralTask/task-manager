import { useQuery } from 'react-query'
import { castImmutable } from 'immer'
import apiClient from '../../utils/api'

interface TDailyTaskCompletionSource {
    source_id: string
    count: number
}
export interface TDailyTaskCompletion {
    date: string
    sources: TDailyTaskCompletionSource[]
}

interface DailyTaskCompletionParams {
    datetime_start: string
    datetime_end: string
}

export const useGetDailyTaskCompletion = (params: DailyTaskCompletionParams) => {
    return useQuery<TDailyTaskCompletion[]>(['daily_task_completion', params], () => getDailyTaskCompletion(params))
}

// wrapper used to abstract date logic to just pass month/year
export const useGetDailyTaskCompletionByMonth = (month: number, year: number) => {
    const datetime_start = new Date(year, month - 1, 1).toISOString()
    const datetime_end = new Date(year, month, 0).toISOString()
    return useGetDailyTaskCompletion({ datetime_start, datetime_end })
}

export const getDailyTaskCompletion = async (
    params: DailyTaskCompletionParams,
    { signal }: { signal?: AbortSignal } = {}
) => {
    try {
        const res = await apiClient.get('/daily_task_completion/', {
            params,
            signal,
        })
        return castImmutable(res.data)
    } catch {
        throw 'getDailyTaskCompletion failed'
    }
}
