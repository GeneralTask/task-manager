import React from 'react'
import { CalendarContextProvider } from '../components/calendar/CalendarContext'
import { LocalStorageContextProvider } from './LocalStorageContext'
import { ShortcutContextProvider } from './ShortcutContext'

interface AppContextProviderProps {
    children: React.ReactNode
}
const AppContextProvider = ({ children }: AppContextProviderProps) => {
    return (
        <CalendarContextProvider>
            <ShortcutContextProvider>
                <LocalStorageContextProvider>{children}</LocalStorageContextProvider>
            </ShortcutContextProvider>
        </CalendarContextProvider>
    )
}

export default AppContextProvider
