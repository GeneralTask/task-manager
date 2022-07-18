import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { TEmailThread, TPullRequest, TTask } from '../utils/types'
import useKeyboardShortcut from './useKeyboardShortcut'


export default function useItemSelectionController(items: TTask[] | TEmailThread[] | TPullRequest[], selectItem: (itemId: string) => void) {
    const params = useParams()
    const selectedItemId = params.task ?? params.thread ?? params.pullRequest

    // on press DOWN -> select first item
    const onUpDown = useCallback(
        (direction: 'up' | 'down') => {
            let newSelectedItem = ''
            // if an item is not selected, select the first one
            if (selectedItemId == null && items.length > 0) {
                newSelectedItem = items[0].id
            } else {
                const index = items.findIndex((item) => item.id === selectedItemId)
                // if for some reason the task is not found, select the first one
                if (index === -1) {
                    newSelectedItem = items[0].id
                } else if (direction === 'up' && index > 0) {
                    newSelectedItem = items[index - 1].id
                } else if (direction === 'down' && index < items.length - 1) {
                    newSelectedItem = items[index + 1].id
                }
            }
            if (newSelectedItem) {
                selectItem(newSelectedItem)
            }
        },
        [selectedItemId, items, selectItem]
    )

    useKeyboardShortcut('down', () => onUpDown('down'))
    useKeyboardShortcut('up', () => onUpDown('up'))
    useKeyboardShortcut('arrowDown', () => onUpDown('down'))
    useKeyboardShortcut('arrowUp', () => onUpDown('up'))
}
