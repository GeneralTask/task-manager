import { ReactNode, createContext, useContext, useRef } from 'react'
import { QueryKey } from 'react-query'

type TRequest = () => void

interface TQueryContext {
    getQueryQueue: (key: QueryKey) => TRequest[]
}

const QueryContext = createContext<TQueryContext>({
    getQueryQueue: () => [],
})

interface QueryContextProps {
    children: ReactNode
}

export const QueryContextProvider = ({ children }: QueryContextProps) => {
    const queueRef = useRef<Map<QueryKey, TRequest[]>>(new Map())

    const getQueryQueue = (key: QueryKey): TRequest[] => {
        const queue = queueRef.current.get(key)
        if (!queue) {
            const newQueue: TRequest[] = []
            queueRef.current.set(key, newQueue)
            return newQueue
        }
        return queue
    }

    return (
        <QueryContext.Provider
            value={{
                getQueryQueue,
            }}
        >
            {children}
        </QueryContext.Provider>
    )
}

const useQueryContext = () => useContext(QueryContext)

export default useQueryContext
