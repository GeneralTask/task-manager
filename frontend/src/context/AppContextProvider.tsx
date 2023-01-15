import React from 'react'
import { CalendarContextProvider, FocusModeContextProvider } from '../components/calendar/CalendarContext'
import { QueryContextProvider } from './QueryContext'
import { ShortcutContextProvider } from './ShortcutContext'

interface AppContextProviderProps {
    children: React.ReactNode
}
const AppContextProvider = ({ children }: AppContextProviderProps) => {
    return (
        <QueryContextProvider>
            <CalendarContextProvider>
                <FocusModeContextProvider>
                    <ShortcutContextProvider>{children}</ShortcutContextProvider>
                </FocusModeContextProvider>
            </CalendarContextProvider>
        </QueryContextProvider>
    )
}

export default AppContextProvider
