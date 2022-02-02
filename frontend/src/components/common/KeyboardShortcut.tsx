import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { BACKGROUND_WHITE, SHADOW_KEYBOARD_SHORTCUT, TEXT_GRAY } from '../../helpers/styles'

const KeyboardShortcutContainer = styled.div<{ isPressed: boolean }>`
    height: 24px;
    width: 24px;
    display: flex;
    flex-shrink: 0;
    background: ${BACKGROUND_WHITE};
    box-shadow: ${SHADOW_KEYBOARD_SHORTCUT};
    margin-right: 12px;
    border-radius: 5px;

    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: ${TEXT_GRAY};
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    ${({ isPressed }) => isPressed ? 'background-color: red;' : ''}
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

    if (keyName === shortcut) {
        // see comments about blocking key above
        e.preventDefault()
        return true
    }
    return false
}

export { KeyboardShortcut, useKeyboardShortcut }