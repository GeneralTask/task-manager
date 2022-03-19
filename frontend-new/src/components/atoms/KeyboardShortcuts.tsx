import { Colors } from '../../styles'
import React, { useCallback, useEffect, useState } from 'react'

import styled from 'styled-components/native'
import { useAppSelector } from '../../redux/hooks'
import { ModalEnum } from '../../utils/enums'

const KeyboardShortcutContainer = styled.View<{ isPressed: boolean }>`
    cursor: inherit;
    border-radius: 5px;
    border: 2px solid ${({ isPressed }) => (isPressed ? 'black' : Colors.gray._50)};
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    left: 0px;
    top: 0px;
    background-color: ${Colors.gray._50};
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);
    margin-right: 12px;
`
const KeyboardShortcutText = styled.Text`
    color: ${Colors.gray._400};
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;
`

// gets triggered when the lowercase letter is pressed (including with CAPS LOCK, but not when you hit shift+key)
interface KeyboardShortcutProps {
    shortcut: string
    onKeyPress: () => void
    disabled?: boolean
}
function KeyboardShortcut({ shortcut, onKeyPress, disabled }: KeyboardShortcutProps): JSX.Element {
    const isKeyDown = useKeyboardShortcut(shortcut, onKeyPress, !!disabled)
    return (
        <KeyboardShortcutContainer isPressed={isKeyDown}>
            <KeyboardShortcutText>{shortcut}</KeyboardShortcutText>
        </KeyboardShortcutContainer>
    )
}

// Keeps state inside of separate component so parent does not have to be re-rendered
function InvisibleKeyboardShortcut({ shortcut, onKeyPress, disabled }: KeyboardShortcutProps): JSX.Element {
    if (!disabled) {
        disabled = false
    }
    useKeyboardShortcut(shortcut, onKeyPress, disabled)
    return <></>
}

function useKeyboardShortcut(shortcut: string, onKeyPress: () => void, disabled = false): boolean {
    const [isKeyDown, setIsKeyDown] = useState(false)

    //Keyboard shortcuts should not trigger when modal is open
    const { isModalOpen } = useAppSelector((state) => ({
        isModalOpen: state.tasks_page.modals.show_modal !== ModalEnum.NONE,
    }))

    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!disabled && !isModalOpen && wasValidKeyPressed(shortcut, event)) {
                setIsKeyDown(true)
                onKeyPress()
            }
        },
        [shortcut, onKeyPress, isModalOpen]
    )
    const onKeyUp = useCallback(
        (event: KeyboardEvent) => {
            if (!disabled && !isModalOpen && wasValidKeyPressed(shortcut, event)) {
                setIsKeyDown(false)
            }
        },
        [shortcut, isModalOpen, disabled]
    )

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

export { KeyboardShortcut, InvisibleKeyboardShortcut, useKeyboardShortcut }
