import { useEffect } from 'react'
import produce from 'immer'
import KEYBOARD_SHORTCUTS, { TShortcutName } from '../constants/shortcuts'
import useShortcutContext from '../context/ShortcutContext'
import Log from '../services/api/log'

// action should be a useCallback function to avoid unnecessary rerenders
export default function useKeyboardShortcut(shortcutName: TShortcutName, action: () => void, disabled = false) {
    const { setActiveKeyboardShortcuts } = useShortcutContext()
    const shortcut = KEYBOARD_SHORTCUTS[shortcutName]
    useEffect(() => {
        if (!disabled) {
            setActiveKeyboardShortcuts((activeShortcuts) =>
                produce(activeShortcuts, (draft) => {
                    draft.set(shortcut.key, {
                        ...shortcut,
                        action: () => {
                            action()
                            Log(`keyboard_shortcut_${shortcut.label.replaceAll(' ', '_').toLowerCase()}`)
                        },
                    })
                })
            )

            return () => {
                setActiveKeyboardShortcuts((activeShortcuts) =>
                    produce(activeShortcuts, (draft) => {
                        draft.delete(shortcut.key)
                    })
                )
            }
        }
    }, [shortcutName, action, disabled, setActiveKeyboardShortcuts])
}
