import React from 'react'
import { QueryContextProvider } from './QueryContext'
import { ShortcutContextProvider } from './ShortcutContext'

interface AppContextProviderProps {
    children: React.ReactNode
}
const AppContextProvider = ({ children }: AppContextProviderProps) => {
    return (
        <QueryContextProvider>
            <ShortcutContextProvider>{children}</ShortcutContextProvider>
        </QueryContextProvider>
    )
}

export default AppContextProvider
