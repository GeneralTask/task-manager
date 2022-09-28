import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import useSortAndFilterSettings from '../../../utils/sortAndFilter/useSortAndFilterSettings'
import SortSelector from '../../molecules/SortSelector'
import PullRequestList from '../../pull-requests/PullRequestList'
import { PR_SORT_AND_FILTER_CONFIG } from '../../pull-requests/constants'
import { ViewHeader, ViewName } from '../styles'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const PullRequestViewItems = forwardRef(({ view, visibleItemsCount }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
    const { overviewItemId } = useParams()
    const { sortItems, selectedSort, setSelectedSort, selectedSortDirection, setSelectedSortDirection } =
        useSortAndFilterSettings(PR_SORT_AND_FILTER_CONFIG, view.id)
    return (
        <>
            <ViewHeader ref={ref}>
                <ViewName>{view.name}</ViewName>
                {view.view_items.length > 0 && (
                    <SortSelector
                        items={sortItems}
                        selectedSort={selectedSort}
                        setSelectedSort={setSelectedSort}
                        selectedSortDirection={selectedSortDirection}
                        setSelectedSortDirection={setSelectedSortDirection}
                    />
                )}
            </ViewHeader>
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
                overviewViewId={view.id}
                visibleItemsCount={visibleItemsCount}
            />
        </>
    )
})

export default PullRequestViewItems
