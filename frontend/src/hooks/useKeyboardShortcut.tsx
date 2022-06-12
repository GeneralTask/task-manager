import { KEYBOARD_SHORTCUTS, TKeyboardShortcuts } from '../constants'
import { useAppSelector } from '../redux/hooks'
import { ModalEnum } from '../utils/enums'
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

    //Keyboard shortcuts should not trigger when modal is open
    const { isModalOpen } = useAppSelector((state) => ({
        isModalOpen: state.tasks_page.modals.show_modal !== ModalEnum.NONE,
    }))

    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!disabled && !isModalOpen && wasValidKeyPressed(shortcut, event)) {
                if (showIndicator) {
                    setShowKeyDownIndicator(true)
                }
                isKeyDown.current = true
                onKeyPress()
                event.stopPropagation()
            }
        },
        [shortcut, onKeyPress, isModalOpen, showIndicator, disabled]
    )
    const onKeyUp = useCallback(
        (event: KeyboardEvent) => {
            if (!disabled && !isModalOpen && wasValidKeyPressed(shortcut, event)) {
                if (showIndicator) {
                    setShowKeyDownIndicator(false)
                }
                isKeyDown.current = false
                event.stopPropagation()
            }
        },
        [shortcut, isModalOpen, disabled, showIndicator, disabled]
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
 * we should not assign a keyboard shortcut to existing actions - i.e. ctrl+a, ctrl+s, ctrl+d
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
