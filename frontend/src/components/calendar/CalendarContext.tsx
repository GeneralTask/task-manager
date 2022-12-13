import React, { createContext, useContext, useState } from 'react'
import { DateTime } from 'luxon'
import { useGTLocalStorage } from '../../hooks'
import { TEvent } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'
import { TCalendarType } from '../views/CalendarView'

export interface ContextValues {
    date: DateTime
    dayViewDate: DateTime
    calendarType: TCalendarType
    showMainHeader: boolean
    showDateHeader: boolean
    isCollapsed: boolean
    isTaskDraggingOverDetailsView: boolean
    selectedEvent: TEvent | null
    isPopoverDisabled: boolean
    isTasksDueViewCollapsed: boolean
    disableSelectEvent: boolean
    isTasksOverdueViewCollapsed: boolean
    showTaskToCalSidebar: boolean
    setDate: React.Dispatch<React.SetStateAction<DateTime>>
    setDayViewDate: React.Dispatch<React.SetStateAction<DateTime>>
    setCalendarType: React.Dispatch<React.SetStateAction<TCalendarType>>
    setShowMainHeader: React.Dispatch<React.SetStateAction<boolean>>
    setShowDateHeader: React.Dispatch<React.SetStateAction<boolean>>
    setIsCollapsed: (isCollapsed: boolean) => void
    setIsTaskDraggingOverDetailsView: (isTaskDraggingOverDetailsView: boolean) => void
    setSelectedEvent: (event: TEvent | null) => void
    setIsPopoverDisabled: React.Dispatch<React.SetStateAction<boolean>>
    setIsTasksDueViewCollapsed: React.Dispatch<React.SetStateAction<boolean>>
    setIsTasksOverdueViewCollapsed: React.Dispatch<React.SetStateAction<boolean>>
    setShowTaskToCalSidebar: React.Dispatch<React.SetStateAction<boolean>>
}
const CalendarContext = createContext<ContextValues>({
    date: DateTime.now(),
    dayViewDate: DateTime.now(),
    calendarType: 'day',
    showMainHeader: true,
    showDateHeader: true,
    isCollapsed: false,
    isTaskDraggingOverDetailsView: false,
    selectedEvent: null,
    isPopoverDisabled: false,
    isTasksDueViewCollapsed: false,
    disableSelectEvent: false,
    isTasksOverdueViewCollapsed: false,
    showTaskToCalSidebar: false,
    setDate: emptyFunction,
    setDayViewDate: emptyFunction,
    setCalendarType: emptyFunction,
    setShowMainHeader: emptyFunction,
    setShowDateHeader: emptyFunction,
    setIsCollapsed: emptyFunction,
    setIsTaskDraggingOverDetailsView: emptyFunction,
    setSelectedEvent: emptyFunction,
    setIsPopoverDisabled: emptyFunction,
    setIsTasksDueViewCollapsed: emptyFunction,
    setIsTasksOverdueViewCollapsed: emptyFunction,
    setShowTaskToCalSidebar: emptyFunction,
})

export const useCalendarContext = () => {
    return useContext(CalendarContext)
}

interface CalendarContextProviderProps {
    children: React.ReactNode
}
export const CalendarContextProvider = ({ children }: CalendarContextProviderProps) => {
    const [date, setDate] = useState<DateTime>(DateTime.now())
    const [dayViewDate, setDayViewDate] = useState<DateTime>(DateTime.now())
    const [calendarType, setCalendarType] = useState<TCalendarType>('day')
    const [showMainHeader, setShowMainHeader] = useState<boolean>(true)
    const [showDateHeader, setShowDateHeader] = useState<boolean>(true)
    const [isCollapsed, setIsCollapsed] = useGTLocalStorage('calendarCollapsed', false)
    const [isTaskDraggingOverDetailsView, setIsTaskDraggingOverDetailsView] = useState<boolean>(false)
    const [selectedEvent, setSelectedEvent] = useState<TEvent | null>(null)
    const [isPopoverDisabled, setIsPopoverDisabled] = useState<boolean>(false)
    const [isTasksDueViewCollapsed, setIsTasksDueViewCollapsed] = useGTLocalStorage('dueTodayCollapsed', false)
    const [isTasksOverdueViewCollapsed, setIsTasksOverdueViewCollapsed] = useGTLocalStorage('overdueCollapsed', false)
    const [showTaskToCalSidebar, setShowTaskToCalSidebar] = useGTLocalStorage('taskToCalendarSidebar', false)
    const collapseAndSetType = (isCollapsed: boolean) => {
        setIsCollapsed(isCollapsed)
        if (isCollapsed) setCalendarType('day')
    }

    const value = {
        date,
        dayViewDate,
        calendarType,
        showMainHeader,
        showDateHeader,
        isCollapsed,
        isTaskDraggingOverDetailsView,
        selectedEvent,
        isPopoverDisabled,
        isTasksDueViewCollapsed,
        disableSelectEvent: false,
        isTasksOverdueViewCollapsed,
        showTaskToCalSidebar,
        setDate,
        setDayViewDate,
        setCalendarType,
        setShowMainHeader,
        setShowDateHeader,
        setIsCollapsed: collapseAndSetType,
        setIsTaskDraggingOverDetailsView,
        setSelectedEvent,
        setIsPopoverDisabled,
        setIsTasksDueViewCollapsed,
        setIsTasksOverdueViewCollapsed,
        setShowTaskToCalSidebar,
    }

    return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}
