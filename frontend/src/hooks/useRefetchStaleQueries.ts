import { useGTQueryClient } from '../services/queryUtils'

const useRefetchStaleQueries = () => {
    const queryClient = useGTQueryClient()
    return () => {
        queryClient.refetchQueries({ stale: true })
    }
}

export default useRefetchStaleQueries
