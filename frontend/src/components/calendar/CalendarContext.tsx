import React, { createContext, useContext, useState } from 'react'
import { TCalendarType } from '../views/CalendarView'

export interface ContextValues {
    calendarType: TCalendarType
    showMainHeader: boolean
    showDateHeader: boolean
    isCollapsed: boolean
    setCalendarType: React.Dispatch<React.SetStateAction<TCalendarType>>
    setShowMainHeader: React.Dispatch<React.SetStateAction<boolean>>
    setShowDateHeader: React.Dispatch<React.SetStateAction<boolean>>
    setIsCollapsed: (isCollapsed: boolean) => void
}
const CalendarContext = createContext<ContextValues>({
    calendarType: 'day',
    showMainHeader: true,
    showDateHeader: true,
    isCollapsed: false,
    setCalendarType: () => {},
    setShowMainHeader: () => {},
    setShowDateHeader: () => {},
    setIsCollapsed: () => {},
})

export const useCalendarContext = () => {
    return useContext(CalendarContext)
}

interface CalendarProviderProps {
    children: React.ReactNode
}
const CalendarProvider = ({ children }: CalendarProviderProps) => {
    const [calendarType, setCalendarType] = useState<TCalendarType>('day')
    const [showMainHeader, setShowMainHeader] = useState<boolean>(true)
    const [showDateHeader, setShowDateHeader] = useState<boolean>(true)
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
    const collapseAndSetType = (isCollapsed: boolean) => {
        setIsCollapsed(isCollapsed)
        if (isCollapsed) setCalendarType('day')
    }

    const value = {
        calendarType: calendarType,
        showMainHeader: showMainHeader,
        showDateHeader: showDateHeader,
        isCollapsed: isCollapsed,
        setCalendarType: setCalendarType,
        setShowMainHeader: setShowMainHeader,
        setShowDateHeader: setShowDateHeader,
        setIsCollapsed: collapseAndSetType,
    }

    return <CalendarContext.Provider value={value} children={children} />
}

export default CalendarProvider
