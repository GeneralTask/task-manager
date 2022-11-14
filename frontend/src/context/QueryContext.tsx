import { ReactNode, createContext, useContext, useRef } from 'react'
import { QueryKey } from 'react-query'
import * as Sentry from '@sentry/browser'
import { emptyFunction } from '../utils/utils'

interface TRequest {
    // if optimistic ID is provided, the actual id must be passed into the send function
    send: (id: string) => void
    optimisticId?: string
}

interface TQueryContext {
    getQueryQueue: (key: QueryKey) => TRequest[]
    getIdFromOptimisticId: (optimisticId: string) => string
    setOptimisticId: (optimisticId: string, realId: string) => void
}

const QueryContext = createContext<TQueryContext>({
    getQueryQueue: () => [],
    getIdFromOptimisticId: () => '',
    setOptimisticId: emptyFunction,
})

interface QueryContextProps {
    children: ReactNode
}

export const QueryContextProvider = ({ children }: QueryContextProps) => {
    const queueRef = useRef<Map<QueryKey, TRequest[]>>(new Map())
    const optimisticIdToRealIdMap = useRef<Map<string, string>>(new Map())

    const getQueryQueue = (key: QueryKey): TRequest[] => {
        const queue = queueRef.current.get(key)
        if (!queue) {
            const newQueue: TRequest[] = []
            queueRef.current.set(key, newQueue)
            return newQueue
        }
        return queue
    }

    const getIdFromOptimisticId = (optimisticId: string) => {
        const realId = optimisticIdToRealIdMap.current.get(optimisticId)
        if (!realId) {
            Sentry.captureMessage(`Could not find real id for optimistic id`)
            return ''
        }
        return realId
    }

    const setOptimisticId = (optimisticId: string, realId: string) => {
        optimisticIdToRealIdMap.current.set(optimisticId, realId)
    }

    return (
        <QueryContext.Provider
            value={{
                getQueryQueue,
                getIdFromOptimisticId,
                setOptimisticId,
            }}
        >
            {children}
        </QueryContext.Provider>
    )
}

const useQueryContext = () => useContext(QueryContext)

export default useQueryContext
