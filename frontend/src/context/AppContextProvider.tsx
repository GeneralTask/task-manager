import { CalendarContextProvider } from '../components/calendar/CalendarContext'
import { ShortcutContextProvider } from './ShortcutContext'
import React from 'react'

interface AppContextProviderProps {
    children: React.ReactNode
}
const AppContextProvider = ({ children }: AppContextProviderProps) => {
    return (
        <CalendarContextProvider>
            <ShortcutContextProvider>{children}</ShortcutContextProvider>
        </CalendarContextProvider>
    )
}

export default AppContextProvider
