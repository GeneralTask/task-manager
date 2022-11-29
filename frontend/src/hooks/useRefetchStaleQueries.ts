import { useCallback } from 'react'
import { useBackfillRecurringTasks } from '../services/api/recurring-tasks.hooks'
import { useFetchExternalTasks } from '../services/api/tasks.hooks'
import { useGTQueryClient } from '../services/queryUtils'

const useRefetchStaleQueries = () => {
    const queryClient = useGTQueryClient()
    const { refetch: refetchExternalTasks } = useFetchExternalTasks()
    const { refetch: backfillRecurringTasks } = useBackfillRecurringTasks()
    return useCallback(async () => {
        await Promise.all([backfillRecurringTasks(), refetchExternalTasks()])
        queryClient.refetchQueries({ stale: true })
    }, [queryClient, refetchExternalTasks])
}

export default useRefetchStaleQueries
