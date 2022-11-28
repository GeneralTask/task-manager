import { QueryFunctionContext, useQuery } from 'react-query'
import { castImmutable } from 'immer'
import apiClient from '../../utils/api'
import { TTaskV4 } from '../../utils/types'

export const useGetTasksV4 = (isEnabled = true) => {
    return useQuery<TTaskV4[], void>('tasks_v4', getTasksV4, { enabled: isEnabled, refetchOnMount: false })
}
const getTasksV4 = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/tasks/v4/', { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('getTasks failed')
    }
}
