import { useCallback, useEffect } from 'react'

import { Dispatch } from '@reduxjs/toolkit'
import { useAppDispatch } from '../redux/hooks'
import { setFocusCreateTaskForm } from '../redux/tasksPageSlice'

const keyboardShortcuts = new Map<string, (dispatch: Dispatch) => void>([
    ['n', (dispatch) => dispatch(setFocusCreateTaskForm(true))],
    // TODO: Focus new task creation form on 'n'
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

export function useKeyboardShortcuts() {
    const dispatch = useAppDispatch()
    const onKeyPress = useCallback((e: KeyboardEvent) => handleKeyboardShortcuts(e, dispatch), [dispatch])
    useEffect(() => {
        document.addEventListener('keydown', onKeyPress)
        return () => {
            document.removeEventListener('keydown', onKeyPress)
        }
    })
}
