import React from 'react'
import { CalendarContextProvider } from '../components/calendar/CalendarContext'
import { ShortcutContextProvider } from './ShortcutContext'

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
