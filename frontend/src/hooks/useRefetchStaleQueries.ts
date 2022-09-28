import { useCallback } from 'react'
import { useFetchExternalTasks } from '../services/api/tasks.hooks'
import { useGTQueryClient } from '../services/queryUtils'

const useRefetchStaleQueries = () => {
    const queryClient = useGTQueryClient()
    const { refetch: refetchExternalTasks } = useFetchExternalTasks()
    return useCallback(() => {
        refetchExternalTasks()
        queryClient.refetchQueries({ stale: true })
    }, [queryClient, refetchExternalTasks])
}

export default useRefetchStaleQueries
