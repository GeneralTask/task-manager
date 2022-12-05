import React from 'react'
import { ToastProvider } from '@radix-ui/react-toast'
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
                <ShortcutContextProvider>
                    <ToastProvider>{children}</ToastProvider>
                </ShortcutContextProvider>
            </CalendarContextProvider>
        </QueryContextProvider>
    )
}

export default AppContextProvider
