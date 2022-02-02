import { BACKGROUND_KEYBOARD_SHORTCUT, SHADOW_KEYBOARD_SHORTCUT, TEXT_KEYBOARD_SHORTCUT } from '../../helpers/styles'
import React, { useCallback, useEffect, useState } from 'react'

import styled from 'styled-components'
import store from '../../redux/store'

const KeyboardShortcutContainer = styled.div<{ isPressed: boolean }>`
    cursor: inherit;
    border-radius: 5px;
    border: 2px solid ${({ isPressed }) => isPressed ? 'black' : BACKGROUND_KEYBOARD_SHORTCUT};
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    left: 0px;
    top: 0px;
    background-color: ${BACKGROUND_KEYBOARD_SHORTCUT};
    box-shadow: ${SHADOW_KEYBOARD_SHORTCUT};
    margin-right: 12px;
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;
    color: ${TEXT_KEYBOARD_SHORTCUT};
`

// gets triggered when the lowercase letter is pressed (including with CAPS LOCK, but not when you hit shift+key)
interface Props {
    shortcut: string,
    onKeyPress: () => void,
}
function KeyboardShortcut({ shortcut, onKeyPress }: Props): JSX.Element {
    const isKeyDown = useKeyboardShortcut(shortcut, onKeyPress)
    return (
        <KeyboardShortcutContainer isPressed={isKeyDown}>
            {shortcut}
        </KeyboardShortcutContainer>
    )
}


function useKeyboardShortcut(shortcut: string, onKeyPress: () => void): boolean {
    const [isKeyDown, setIsKeyDown] = useState(false)

    const onKeyDown = useCallback((event: KeyboardEvent) => {
        if (wasValidKeyPressed(shortcut, event)) {
            setIsKeyDown(true)
            onKeyPress()
        }
    }, [shortcut, onKeyPress])
    const onKeyUp = useCallback((event: KeyboardEvent) => {
        if (wasValidKeyPressed(shortcut, event)) {
            setIsKeyDown(false)
        }
    }, [shortcut])

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown)
        document.addEventListener('keyup', onKeyUp)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.removeEventListener('keyup', onKeyUp)
        }
    })

    return isKeyDown
}

/**
 * Check if a valid key is pressed.
 * Will prevent default behavior of a key
 * we should not assign a keyboard shortcut to existing actions - i.e. ctrl+a, ctrl+s, ctrl+d
 **/
function wasValidKeyPressed(shortcut: string, e: KeyboardEvent): boolean {
    const isModalOpen = store.getState().tasks_page.events.show_modal
    if (isModalOpen) return false
    if (e.ctrlKey || e.altKey || e.metaKey) {
        return false
    }
    let keyName = ''
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

export { KeyboardShortcut, useKeyboardShortcut }
