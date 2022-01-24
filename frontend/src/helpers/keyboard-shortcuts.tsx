import { useCallback, useEffect } from 'react'

import { Dispatch } from '@reduxjs/toolkit'
import { setShowCreateTaskForm } from '../redux/tasksPageSlice'
import { useAppDispatch } from '../redux/hooks'

const keyboardShortcuts = new Map<string, (dispatch: Dispatch) => void>([
    ['n', (dispatch) => dispatch(setShowCreateTaskForm(true))],
])

function handleKeyboardShortcuts(e: KeyboardEvent, dispatch: Dispatch): void {
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
