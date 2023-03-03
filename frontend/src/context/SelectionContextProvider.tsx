import { createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { usePreviewMode } from '../hooks'
import { TTaskV4 } from '../utils/types'
import { emptyFunction } from '../utils/utils'

interface TSelectionContext {
    onClickHandler: (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
        id: string,
        isTrashOrComplete: boolean,
        currentlySelectedTaskId: string,
        sortedTasks: TTaskV4[]
    ) => void
    isTaskSelected: (id: string) => boolean
    inMultiSelectMode: boolean
    selectedTaskIds: string[]
    clearSelectedTaskIds: () => void
}

const SelectionContext = createContext<TSelectionContext>({
    onClickHandler: emptyFunction,
    isTaskSelected: () => false,
    inMultiSelectMode: false,
    selectedTaskIds: [],
    clearSelectedTaskIds: emptyFunction,
})

interface SelectionContextProviderProps {
    children: React.ReactNode
}

export const SelectionContextProvider = ({ children }: SelectionContextProviderProps) => {
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
    const clearSelectedTaskIds = () => setSelectedTaskIds([])
    const isTaskSelected = (id: string) => selectedTaskIds.includes(id)
    const inMultiSelectMode = selectedTaskIds.length > 0
    const { isPreviewMode } = usePreviewMode()

    useEffect(() => {
        if (!isPreviewMode) {
            clearSelectedTaskIds()
        }
    }, [isPreviewMode])
    // Clear selected tasks when user changes pages
    const { pathname, key } = useLocation()
    useEffect(() => {
        clearSelectedTaskIds()
    }, [pathname, key])

    // Clear selected tasks when user clicks escape key
    useEffect(() => {
        const clearOnEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                clearSelectedTaskIds()
            }
        }
        document.addEventListener('keydown', clearOnEscape)
        return () => {
            document.removeEventListener('keydown', clearOnEscape)
        }
    }, [])

    // Toggle task id in selectedTaskIds (if it's already selected, remove it, otherwise add it)
    const toggleTaskId = (taskId: string) => {
        if (selectedTaskIds.includes(taskId)) {
            setSelectedTaskIds(selectedTaskIds.filter((id) => id !== taskId))
        } else {
            setSelectedTaskIds([...selectedTaskIds, taskId])
        }
    }

    const onClickHandler = (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
        id: string,
        isTrashOrComplete: boolean,
        currentlySelectedTaskId: string,
        sortedTasks: TTaskV4[]
    ) => {
        if (!isPreviewMode) return
        e.stopPropagation()
        e.preventDefault()
        if (isTrashOrComplete) return

        if (e.metaKey) {
            toggleTaskId(id)
        } else if (e.shiftKey) {
            const lastSelectedTaskId =
                selectedTaskIds.length !== 0 ? selectedTaskIds[selectedTaskIds.length - 1] : currentlySelectedTaskId
            if (lastSelectedTaskId) {
                const clickedTaskIndex = sortedTasks.findIndex((task) => task.id === id)
                const lastSelectedTaskIndex = sortedTasks.findIndex((task) => task.id === lastSelectedTaskId)

                const start = Math.min(clickedTaskIndex, lastSelectedTaskIndex)
                const end = Math.max(clickedTaskIndex, lastSelectedTaskIndex)
                const newSelectedTaskIds = sortedTasks.slice(start, end + 1).map((task) => task.id)
                setSelectedTaskIds([
                    ...selectedTaskIds,
                    ...newSelectedTaskIds.filter((id) => !selectedTaskIds.includes(id)),
                ])
            }
        }
    }

    return (
        <SelectionContext.Provider
            value={{
                onClickHandler,
                isTaskSelected,
                inMultiSelectMode,
                selectedTaskIds,
                clearSelectedTaskIds,
            }}
        >
            {children}
        </SelectionContext.Provider>
    )
}

const useSelectionContext = () => useContext(SelectionContext)
export default useSelectionContext
