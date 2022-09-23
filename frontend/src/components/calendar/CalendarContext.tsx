import { createContext, useContext, useState } from 'react'
import { TEvent } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'
import { TCalendarType } from '../views/CalendarView'

export interface ContextValues {
    calendarType: TCalendarType
    showMainHeader: boolean
    showDateHeader: boolean
    isCollapsed: boolean
    isTaskDraggingOverDetailsView: boolean
    selectedEvent: TEvent | null
    isPopoverDisabled: boolean
    setCalendarType: React.Dispatch<React.SetStateAction<TCalendarType>>
    setShowMainHeader: React.Dispatch<React.SetStateAction<boolean>>
    setShowDateHeader: React.Dispatch<React.SetStateAction<boolean>>
    setIsCollapsed: (isCollapsed: boolean) => void
    setIsTaskDraggingOverDetailsView: (isTaskDraggingOverDetailsView: boolean) => void
    setSelectedEvent: (event: TEvent | null) => void
    setIsPopoverDisabled: React.Dispatch<React.SetStateAction<boolean>>
}
const CalendarContext = createContext<ContextValues>({
    calendarType: 'day',
    showMainHeader: true,
    showDateHeader: true,
    isCollapsed: false,
    isTaskDraggingOverDetailsView: false,
    selectedEvent: null,
    isPopoverDisabled: false,
    setCalendarType: emptyFunction,
    setShowMainHeader: emptyFunction,
    setShowDateHeader: emptyFunction,
    setIsCollapsed: emptyFunction,
    setIsTaskDraggingOverDetailsView: emptyFunction,
    setSelectedEvent: emptyFunction,
    setIsPopoverDisabled: emptyFunction,
})

export const useCalendarContext = () => {
    return useContext(CalendarContext)
}

interface CalendarContextProviderProps {
    children: React.ReactNode
}
export const CalendarContextProvider = ({ children }: CalendarContextProviderProps) => {
    const [calendarType, setCalendarType] = useState<TCalendarType>('day')
    const [showMainHeader, setShowMainHeader] = useState<boolean>(true)
    const [showDateHeader, setShowDateHeader] = useState<boolean>(true)
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
    const [isTaskDraggingOverDetailsView, setIsTaskDraggingOverDetailsView] = useState<boolean>(false)
    const [selectedEvent, setSelectedEvent] = useState<TEvent | null>(null)
    const [isPopoverDisabled, setIsPopoverDisabled] = useState<boolean>(false)
    const collapseAndSetType = (isCollapsed: boolean) => {
        setIsCollapsed(isCollapsed)
        if (isCollapsed) setCalendarType('day')
    }

    const value = {
        calendarType,
        showMainHeader,
        showDateHeader,
        isCollapsed,
        isTaskDraggingOverDetailsView,
        selectedEvent,
        isPopoverDisabled,
        setCalendarType,
        setShowMainHeader,
        setShowDateHeader,
        setIsCollapsed: collapseAndSetType,
        setIsTaskDraggingOverDetailsView,
        setSelectedEvent,
        setIsPopoverDisabled,
    }

    return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}
