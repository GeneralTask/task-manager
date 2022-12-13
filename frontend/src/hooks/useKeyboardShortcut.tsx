import { useEffect } from 'react'
import produce from 'immer'
import KEYBOARD_SHORTCUTS, { TShortcutName } from '../constants/shortcuts'
import useShortcutContext from '../context/ShortcutContext'
import Log from '../services/api/log'

// action should be a useCallback function to avoid unnecessary rerenders
export default function useKeyboardShortcut(
    shortcutName: TShortcutName | undefined,
    action: () => void,
    disabled = false
) {
    const { setActiveKeyboardShortcuts } = useShortcutContext()
    useEffect(() => {
        if (!disabled && shortcutName) {
            const shortcut = KEYBOARD_SHORTCUTS[shortcutName]
            setActiveKeyboardShortcuts((activeShortcuts) =>
                produce(activeShortcuts, (draft) => {
                    shortcut.key.split('|').forEach((combo) => {
                        draft.set(combo, {
                            ...shortcut,
                            action: () => {
                                action()
                                Log(`keyboard_shortcut_${shortcut.label.replaceAll(' ', '_').toLowerCase()}`)
                            },
                        })
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
