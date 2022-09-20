import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useEffect, useState } from 'react'
import { TShortcut } from '../utils/types'
import { emptyFunction, getKeyCode } from '../utils/utils'

interface TShortcutContext {
    showCommandPalette: boolean
    activeKeyboardShortcuts: Map<string, TShortcut>
    setShowCommandPalette: (showShortcut: boolean) => void
    setActiveKeyboardShortcuts: Dispatch<SetStateAction<Map<string, TShortcut>>>
}

const ShortcutContext = createContext<TShortcutContext>({
    showCommandPalette: false,
    activeKeyboardShortcuts: new Map(),
    setShowCommandPalette: emptyFunction,
    setActiveKeyboardShortcuts: emptyFunction,
})

interface ShortcutContextProps {
    children: ReactNode
}

export const ShortcutContextProvider = ({ children }: ShortcutContextProps) => {
    const [showCommandPalette, setShowCommandPalette] = useState(false)
    const [activeKeyboardShortcuts, setActiveKeyboardShortcuts] = useState<Map<string, TShortcut>>(new Map())

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = getKeyCode(e)
            const shortcut = activeKeyboardShortcuts.get(key)
            if (shortcut) {
                setShowCommandPalette(false)
                shortcut.action()
                e.preventDefault()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [activeKeyboardShortcuts])

    return (
        <ShortcutContext.Provider
            value={{
                showCommandPalette,
                activeKeyboardShortcuts,
                setShowCommandPalette,
                setActiveKeyboardShortcuts,
            }}
        >
            {children}
        </ShortcutContext.Provider>
    )
}

const useShortcutContext = () => useContext(ShortcutContext)

export default useShortcutContext
