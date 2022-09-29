import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import SortAndFilterSelectors from '../../../utils/sortAndFilter/SortAndFilterSelectors'
import useSortAndFilterSettings from '../../../utils/sortAndFilter/useSortAndFilterSettings'
import { TPullRequest } from '../../../utils/types'
import PullRequestList from '../../pull-requests/PullRequestList'
import { PR_SORT_AND_FILTER_CONFIG } from '../../pull-requests/constants'
import { ViewHeader, ViewName } from '../styles'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const PullRequestViewItems = forwardRef(({ view, visibleItemsCount }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
    const { overviewItemId } = useParams()
    const sortAndFilterSettings = useSortAndFilterSettings<TPullRequest>(PR_SORT_AND_FILTER_CONFIG, view.id)
    const { selectedSort, selectedSortDirection, selectedFilter } = sortAndFilterSettings
    return (
        <>
            <ViewHeader ref={ref}>
                <ViewName>{view.name}</ViewName>
            </ViewHeader>
            {view.view_items.length > 0 && <SortAndFilterSelectors settings={sortAndFilterSettings} />}
            {view.view_items.length === 0 && view.is_linked && (
                <EmptyViewItem
                    header="You have no more pull requests!"
                    body="When new pull requests get assigned to you, they will appear here."
                />
            )}
            <PullRequestList
                pullRequests={view.view_items}
                selectedPrId={overviewItemId}
                sort={selectedSort}
                sortDirection={selectedSortDirection}
                filter={selectedFilter}
                overviewViewId={view.id}
                visibleItemsCount={visibleItemsCount}
            />
        </>
    )
})

export default PullRequestViewItems
