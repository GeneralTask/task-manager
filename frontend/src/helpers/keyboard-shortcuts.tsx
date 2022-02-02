import { useCallback, useEffect, useState } from 'react'

import { Dispatch } from '@reduxjs/toolkit'
import { useAppDispatch } from '../redux/hooks'
import { setFocusCreateTaskForm } from '../redux/tasksPageSlice'

import React from 'react'
import styled from 'styled-components'
import { BACKGROUND_WHITE, SHADOW_KEYBOARD_SHORTCUT, TEXT_GRAY } from './styles'

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

interface KeyboardShortcutProps {
    shortcut: string,
    isPressed: boolean,
}
export function KeyboardShortcut(props: KeyboardShortcutProps): JSX.Element {
    return (
        <KeyboardShortcutContainer isPressed={props.isPressed}>
            {props.shortcut}
        </KeyboardShortcutContainer>
    )
}

const keyboardShortcuts = new Map<string, (dispatch: Dispatch) => void>([
    ['n', (dispatch) => dispatch(setFocusCreateTaskForm(true))],
])

function handleKeyboardShortcuts(e: KeyboardEvent, dispatch: Dispatch): void {
    e.preventDefault()
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

    const handler = keyboardShortcuts.get(keyName)
    if (handler != null) {
        handler(dispatch)
    }
}

// export function useKeyboardShortcuts() {
//     const dispatch = useAppDispatch()
//     const onKeyPress = useCallback((e: KeyboardEvent) => handleKeyboardShortcuts(e, dispatch), [dispatch])
//     useEffect(() => {
//         document.addEventListener('keydown', onKeyPress)
//         return () => {
//             document.removeEventListener('keydown', onKeyPress)
//         }
//     })
// }

interface Props {
    key: string,
    onKeyPress: () => void,
}
export default function useKeyboardShortcuts(key: string, onKeyPress: () => void): JSX.Element {
    // const onKeyPress = useCallback((e: KeyboardEvent) => handleKeyboardShortcuts(e, dispatch), [dispatch])
    const [isKeyDown, setIsKeyDown] = useState(false)

    const onKeyDown = useCallback(() => {
        setIsKeyDown(true)
    }, [])
    const onKeyUp = useCallback(() => {
        setIsKeyDown(false)
        onKeyPress()
    }, [onKeyPress])

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown)
        document.addEventListener('keyup', onKeyUp)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.removeEventListener('keyup', onKeyUp)
        }
    })
    return <KeyboardShortcut shortcut={key} isPressed={isKeyDown} />
}
