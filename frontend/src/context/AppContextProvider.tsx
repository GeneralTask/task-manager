import React from 'react'
import { CalendarContextProvider } from '../components/calendar/CalendarContext'
import { QueryContextProvider } from './QueryContext'
import { ShortcutContextProvider } from './ShortcutContext'

interface AppContextProviderProps {
    children: React.ReactNode
}
const AppContextProvider = ({ children }: AppContextProviderProps) => {
    return (
        <QueryContextProvider>
            <CalendarContextProvider>
                <ShortcutContextProvider>{children}</ShortcutContextProvider>
            </CalendarContextProvider>
        </QueryContextProvider>
    )
}

export default AppContextProvider
