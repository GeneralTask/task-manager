import React, { createContext, useContext, useState } from 'react'
import { emptyFunction } from '../../utils/utils'
import { TCalendarType } from '../views/CalendarView'

export interface ContextValues {
    calendarType: TCalendarType
    showMainHeader: boolean
    showDateHeader: boolean
    isCollapsed: boolean
    isTaskDragging: boolean
    setCalendarType: React.Dispatch<React.SetStateAction<TCalendarType>>
    setShowMainHeader: React.Dispatch<React.SetStateAction<boolean>>
    setShowDateHeader: React.Dispatch<React.SetStateAction<boolean>>
    setIsCollapsed: (isCollapsed: boolean) => void
    setIsTaskDragging: (isTaskDragging: boolean) => void
}
const CalendarContext = createContext<ContextValues>({
    calendarType: 'day',
    showMainHeader: true,
    showDateHeader: true,
    isCollapsed: false,
    isTaskDragging: false,
    setCalendarType: emptyFunction,
    setShowMainHeader: emptyFunction,
    setShowDateHeader: emptyFunction,
    setIsCollapsed: emptyFunction,
    setIsTaskDragging: emptyFunction,
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
    const [isTaskDragging, setIsTaskDragging] = useState<boolean>(false)
    const collapseAndSetType = (isCollapsed: boolean) => {
        setIsCollapsed(isCollapsed)
        if (isCollapsed) setCalendarType('day')
    }

    const value = {
        calendarType,
        showMainHeader,
        showDateHeader,
        isCollapsed,
        isTaskDragging,
        setCalendarType,
        setShowMainHeader,
        setShowDateHeader,
        setIsCollapsed: collapseAndSetType,
        setIsTaskDragging,
    }

    return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}
