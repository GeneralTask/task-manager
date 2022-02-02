import { BACKGROUND_KEYBOARD_SHORTCUT, SHADOW_KEYBOARD_SHORTCUT, TEXT_KEYBOARD_SHORTCUT } from '../../helpers/styles'
import React, { useCallback, useEffect, useState } from 'react'

import styled from 'styled-components'

const KeyboardShortcutContainer = styled.div<{ isPressed: boolean }>`
    cursor: inherit;
    border-radius: 5px;
    border: 2px solid ${({ isPressed }) => isPressed ? 'black' : BACKGROUND_KEYBOARD_SHORTCUT};

    /* CSS from figma */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0px;

    position: static;
    width: 20px;
    height: 20px;
    left: 0px;
    top: 0px;

    background-color: ${BACKGROUND_KEYBOARD_SHORTCUT};
    box-shadow: ${SHADOW_KEYBOARD_SHORTCUT};
    flex: none;
    order: 2;
    flex-grow: 0;
    margin-right: 12px;

    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;
    color: ${TEXT_KEYBOARD_SHORTCUT};
`

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
        if (wasKeyPressed(shortcut, event)) {
            setIsKeyDown(true)
            onKeyPress()
        }
    }, [shortcut, onKeyPress])
    const onKeyUp = useCallback((event: KeyboardEvent) => {
        if (wasKeyPressed(shortcut, event)) {
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

// check if the key is pressed
// will prevent default behavior of a key
// we should not assign a keyboard shortcut to existing actions - i.e. ctrl+a, ctrl+s, ctrl+d
function wasKeyPressed(shortcut: string, e: KeyboardEvent): boolean {
    let keyName = ''
    if (e.ctrlKey) {
        keyName += 'ctrl+'
    }
    if (e.altKey) {
        keyName += 'alt+'
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

export { KeyboardShortcut, useKeyboardShortcut }
