import { TMessage, TTask } from '../../utils/types'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'

import { setSelectedItemId } from '../../redux/tasksPageSlice'
import { useCallback } from 'react'
import { useKeyboardShortcut } from '../atoms/KeyboardShortcuts'
import { useParams } from 'react-router-dom'

interface KeyboardSelectorProps {
    items: TTask[] | TMessage[]
    expandItem: (itemId: string) => void
}
export default function ItemSelectionController({ items, expandItem }: KeyboardSelectorProps) {
    const dispatch = useAppDispatch()
    const params = useParams()
    const expandedItem = params.task ?? useParams().message
    // if there is no expanded item, then get the selected item from redux
    const selectedItemId = useAppSelector((state) => expandedItem ?? state.tasks_page.selected_item_id)

    // on press DOWN -> select first item 
    const onUpDown = useCallback(
        (direction: 'up' | 'down') => {
            let newSelectedItem = ''
            // if a task is not selected, select the first one
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
                dispatch(setSelectedItemId(newSelectedItem))
                if (expandedItem) {
                    expandItem(newSelectedItem)
                }
            }
        },
        [selectedItemId, items, expandedItem]
    )

    useKeyboardShortcut('ArrowDown', () => onUpDown('down'))
    useKeyboardShortcut('ArrowUp', () => onUpDown('up'))

    return <></>
}
