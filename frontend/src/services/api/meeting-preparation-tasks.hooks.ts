import { QueryFunctionContext, useQuery } from 'react-query'
import { castImmutable } from 'immer'
import { EVENTS_REFETCH_INTERVAL } from '../../constants'
import apiClient from '../../utils/api'
import { TTaskV4 } from '../../utils/types'
import { getBackgroundQueryOptions } from '../queryUtils'

const getMeetingPreparationTasks = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/meeting_preparation_tasks/', { signal })
        return castImmutable(res.data)
    } catch {
        throw 'getMeetingPreparationTasks failed'
    }
}
export const useGetMeetingPreparationTasks = (isEnabled = true) => {
    return useQuery<TTaskV4[], void>('meeting_preparation_tasks', getMeetingPreparationTasks, {
        enabled: isEnabled,
        refetchOnMount: false,
        ...getBackgroundQueryOptions(EVENTS_REFETCH_INTERVAL),
    })
}
