import React from 'react'
import { QueryContextProvider } from './QueryContext'
import { SelectionContextProvider } from './SelectionContextProvider'
import { ShortcutContextProvider } from './ShortcutContext'

interface AppContextProviderProps {
    children: React.ReactNode
}
const AppContextProvider = ({ children }: AppContextProviderProps) => {
    return (
        <QueryContextProvider>
            <SelectionContextProvider>
                <ShortcutContextProvider>{children}</ShortcutContextProvider>
            </SelectionContextProvider>
        </QueryContextProvider>
    )
}

export default AppContextProvider
