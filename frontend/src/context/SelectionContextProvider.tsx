import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { TRASH_SECTION_ID } from '../constants'
import { useGetTasks } from '../services/api/tasks.hooks'
import { emptyFunction } from '../utils/utils'

interface TSelectionContext {
    onClickHandler: (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
        itemId: string,
        sectionId: string,
        currentlySelectedTaskId: string
    ) => void
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
    const { data: sections } = useGetTasks()

    // clear selected task ids when the location changes
    const { pathname, key } = useLocation()
    useEffect(() => {
        clearSelectedTaskIds()
    }, [pathname, key])

    const onClickHandler = (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
        itemId: string,
        sectionId: string,
        currentlySelectedTaskId: string
    ) => {
        if (sectionId === TRASH_SECTION_ID) return
        e.stopPropagation()
        e.preventDefault()
        if (e.metaKey) {
            toggleTaskId(itemId)
        } else if (e.shiftKey && sections) {
            const lastSelectedTaskId =
                selectedTaskIds.length !== 0 ? selectedTaskIds[selectedTaskIds.length - 1] : currentlySelectedTaskId
            const section = sections.find((s) => s.id === sectionId)
            if (!section) return

            if (lastSelectedTaskId) {
                const clickedTaskIndex = section.tasks.findIndex((s) => s.id === itemId)
                const lastSelectedTaskIndex = section.tasks.findIndex((s) => s.id === lastSelectedTaskId)

                const start = Math.min(clickedTaskIndex, lastSelectedTaskIndex)
                const end = Math.max(clickedTaskIndex, lastSelectedTaskIndex)
                const newSelectedTaskIds = section.tasks.slice(start, end + 1).map((t) => t.id)
                setSelectedTaskIds([
                    ...selectedTaskIds,
                    ...newSelectedTaskIds.filter((id) => !selectedTaskIds.includes(id)),
                ])
            }
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
