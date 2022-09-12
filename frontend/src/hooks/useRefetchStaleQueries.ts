import { useCallback } from "react"
import { useGTQueryClient } from "../services/queryUtils"

const useRefetchStaleQueries = () => {
    const queryClient = useGTQueryClient()
    return useCallback(() => { queryClient.refetchQueries({ stale: true }) }, [queryClient])
}

export default useRefetchStaleQueries
