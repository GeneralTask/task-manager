import { useLayoutEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { TOverviewView } from '../utils/types'

export const INITIAL_PAGE_SIZE = 10
export const PAGE_SIZE = 5

const useGetVisibleItemCount = (list: TOverviewView, filteredItemCount: number) => {
    const [visibleItemsCount, setVisibleItemsCount] = useState(0)
    const { overviewViewId, overviewItemId } = useParams()

    useLayoutEffect(() => {
        setVisibleItemsCount(
            Math.max(
                // Ensure that visibleItemsCount <= view.view_items.length, and that we do not decrease the number of visible items when selecting a new item
                Math.min(visibleItemsCount, filteredItemCount),
                // If view.view_items.length drops below PAGE_SIZE, set visibleItemsCount to view.view_items.length
                Math.min(filteredItemCount, INITIAL_PAGE_SIZE),
                // if the selected item is in this view, ensure it is visible
                list.id === overviewViewId ? list.view_item_ids.findIndex((id) => id === overviewItemId) + 1 : 0
            )
        )
    }, [list, overviewItemId])
    return [visibleItemsCount, setVisibleItemsCount] as const
}

export default useGetVisibleItemCount
