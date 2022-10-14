import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import useKeyboardShortcut from './useKeyboardShortcut'

export default function useItemSelectionController<T extends { id: string }>(
    items: T[],
    selectItem: (itemId: T) => void
) {
    const params = useParams()
    const selectedItemId =
        params.task ?? params.pullRequest ?? params.linearIssueId ?? params.slackTaskId ?? params.overviewItemId

    // on press DOWN -> select first item
    const onUpDown = useCallback(
        (direction: 'up' | 'down') => {
            let newSelectedItem = null
            // if an item is not selected, select the first one
            if (selectedItemId == null && items.length > 0) {
                newSelectedItem = items[0]
            } else {
                const index = items.findIndex((item) => item.id === selectedItemId)
                // if for some reason the task is not found, select the first one
                if (index === -1) {
                    newSelectedItem = items[0]
                } else if (direction === 'up' && index > 0) {
                    newSelectedItem = items[index - 1]
                } else if (direction === 'down' && index < items.length - 1) {
                    newSelectedItem = items[index + 1]
                }
            }
            if (newSelectedItem) {
                selectItem(newSelectedItem)
            }
        },
        [items, selectedItemId, selectItem]
    )

    useKeyboardShortcut(
        'down',
        useCallback(() => onUpDown('down'), [onUpDown])
    )
    useKeyboardShortcut(
        'up',
        useCallback(() => onUpDown('up'), [onUpDown])
    )
    useKeyboardShortcut(
        'arrowDown',
        useCallback(() => onUpDown('down'), [onUpDown])
    )
    useKeyboardShortcut(
        'arrowUp',
        useCallback(() => onUpDown('up'), [onUpDown])
    )
}
