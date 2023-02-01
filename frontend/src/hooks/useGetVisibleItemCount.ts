import { useLayoutEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { INITIAL_PAGE_SIZE } from '../components/overview/OverviewViewContainer'
import { TOverviewView } from '../utils/types'

const useGetVisibleItemCount = (list: TOverviewView, listID: string) => {
    const [visibleItemsCount, setVisibleItemsCount] = useState(0)
    const { overviewViewId, overviewItemId } = useParams()

    useLayoutEffect(() => {
        setVisibleItemsCount(
            Math.max(
                // Ensure that visibleItemsCount <= view.view_items.length, and that we do not decrease the number of visible items when selecting a new item
                Math.min(visibleItemsCount, list.view_items.length),
                // If view.view_items.length drops below PAGE_SIZE, set visibleItemsCount to view.view_items.length
                Math.min(list.view_items.length, INITIAL_PAGE_SIZE),
                // if the selected item is in this view, ensure it is visible
                list.id === overviewViewId ? list.view_items.findIndex((item) => item.id === overviewItemId) + 1 : 0
            )
        )
    }, [list.is_linked, list.view_items, listID, overviewItemId])
    return [visibleItemsCount, setVisibleItemsCount] as const
}

export default useGetVisibleItemCount
