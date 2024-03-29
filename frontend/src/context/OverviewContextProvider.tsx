import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useState } from 'react'
import useOverviewLists from '../components/overview/useOverviewLists'
import { emptyFunction } from '../utils/utils'

interface TOverviewContext {
    openListIds: string[]
    setOpenListIds: Dispatch<SetStateAction<string[]>>
    expandAll: () => void
    collapseAll: () => void
}

const OverviewContext = createContext<TOverviewContext>({
    openListIds: [],
    setOpenListIds: emptyFunction,
    expandAll: emptyFunction,
    collapseAll: emptyFunction,
})
interface OverviewContextProps {
    children: ReactNode
}
export const OverviewContextProvider = ({ children }: OverviewContextProps) => {
    const { lists } = useOverviewLists()
    const [openListIds, setOpenListIds] = useState<string[]>([])
    const expandAll = () => setOpenListIds(lists.map((list) => list.id))
    const collapseAll = () => setOpenListIds([])

    return (
        <OverviewContext.Provider
            value={{
                openListIds,
                setOpenListIds,
                expandAll,
                collapseAll,
            }}
        >
            {children}
        </OverviewContext.Provider>
    )
}

const useOverviewContext = () => useContext(OverviewContext)

export default useOverviewContext
