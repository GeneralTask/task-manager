import { KEYBOARD_SHORTCUTS, TKeyboardShortcuts } from '../constants'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function useKeyboardShortcut(
    shortcutType: TKeyboardShortcuts,
    onKeyPress: () => void,
    disabled = false,
    showIndicator = false
): boolean {
    const isKeyDown = useRef<boolean>(false)
    const [showKeyDownIndicator, setShowKeyDownIndicator] = useState(false)
    const shortcut = KEYBOARD_SHORTCUTS[shortcutType]

    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!disabled && wasValidKeyPressed(shortcut, event)) {
                if (showIndicator) {
                    setShowKeyDownIndicator(true)
                }
                isKeyDown.current = true
                onKeyPress()
                event.stopPropagation()
            }
        },
        [shortcut, onKeyPress, showIndicator, disabled]
    )
    const onKeyUp = useCallback(
        (event: KeyboardEvent) => {
            if (!disabled && wasValidKeyPressed(shortcut, event)) {
                if (showIndicator) {
                    setShowKeyDownIndicator(false)
                }
                isKeyDown.current = false
                event.stopPropagation()
            }
        },
        [shortcut, disabled, showIndicator, disabled]
    )

    useEffect(() => {
        if (!disabled) {
            document.addEventListener('keydown', onKeyDown)
            document.addEventListener('keyup', onKeyUp)
        }
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.removeEventListener('keyup', onKeyUp)
        }
    }, [disabled, onKeyDown, onKeyUp])

    return showKeyDownIndicator
}

/**
 * Check if a valid key is pressed.
 * Will prevent default behavior of a key
 **/
function wasValidKeyPressed(shortcut: string, e: KeyboardEvent): boolean {
    let keyName = ''
    if (e.ctrlKey) {
        keyName += 'ctrl+'
    }
    if (e.metaKey) {
        keyName += 'meta+'
    }
    if (e.shiftKey) {
        keyName += 'shift+'
    }
    keyName += e.key.toLowerCase()

    if (keyName === shortcut.toLowerCase()) {
        // see comments about blocking key above
        e.preventDefault()
        return true
    }
    return false
}
