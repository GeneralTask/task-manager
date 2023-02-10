import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { emptyFunction } from '../utils/utils'

interface TSelectionContext {
    onClickHandler: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, itemId: string) => void
    isTaskSelected: (taskId: string) => boolean
    isInMultiSelectMode: boolean
    selectedTaskIds: string[]
    clearSelectedTaskIds: () => void
}
const SelectionContext = createContext<TSelectionContext>({
    onClickHandler: emptyFunction,
    isTaskSelected: () => false,
    isInMultiSelectMode: false,
    selectedTaskIds: [],
    clearSelectedTaskIds: emptyFunction,
})

interface SelectionContextProps {
    children: ReactNode
}

export const SelectionContextProvider = ({ children }: SelectionContextProps) => {
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
    const clearSelectedTaskIds = () => setSelectedTaskIds([])

    // clear selected task ids when the location changes
    const { pathname, key } = useLocation()
    useEffect(() => {
        clearSelectedTaskIds()
    }, [pathname, key])

    const onClickHandler = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, itemId: string) => {
        e.stopPropagation()
        e.preventDefault()
        if (e.metaKey) {
            toggleTaskId(itemId)
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                clearSelectedTaskIds()
            }
        })
    }, [])

    const isTaskSelected = (taskId: string) => selectedTaskIds.includes(taskId)

    const isInMultiSelectMode = selectedTaskIds.length > 0

    const toggleTaskId = (taskId: string) => {
        if (selectedTaskIds.includes(taskId)) {
            setSelectedTaskIds(selectedTaskIds.filter((id) => id !== taskId))
        } else {
            setSelectedTaskIds([...selectedTaskIds, taskId])
        }
    }

    return (
        <SelectionContext.Provider
            value={{ onClickHandler, isTaskSelected, isInMultiSelectMode, selectedTaskIds, clearSelectedTaskIds }}
        >
            {children}
        </SelectionContext.Provider>
    )
}

const useSelectionContext = () => useContext(SelectionContext)
export default useSelectionContext
