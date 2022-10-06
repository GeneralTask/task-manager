import { Ref, forwardRef, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import SortAndFilterSelectors from '../../../utils/sortAndFilter/SortAndFilterSelectors'
import { PR_SORT_AND_FILTER_CONFIG } from '../../../utils/sortAndFilter/pull-requests.config'
import sortAndFilterItems from '../../../utils/sortAndFilter/sortAndFilterItems'
import useSortAndFilterSettings from '../../../utils/sortAndFilter/useSortAndFilterSettings'
import { TPullRequest } from '../../../utils/types'
import PullRequest from '../../pull-requests/PullRequest'
import { Repository } from '../../pull-requests/styles'
import { ViewHeader, ViewName } from '../styles'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const PullRequestViewItems = forwardRef(
    ({ view, visibleItemsCount, setNumViewItems }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
        const { overviewItemId } = useParams()
        const sortAndFilterSettings = useSortAndFilterSettings<TPullRequest>(PR_SORT_AND_FILTER_CONFIG, view.id)
        const { selectedSort, selectedSortDirection, selectedFilter } = sortAndFilterSettings
        const sortedAndFilteredPullRequests = useMemo(() => {
            const sortedAndFiltered = sortAndFilterItems({
                items: view.view_items,
                sort: selectedSort,
                sortDirection: selectedSortDirection,
                filter: selectedFilter,
                tieBreakerField: PR_SORT_AND_FILTER_CONFIG.tieBreakerField,
            })
            setNumViewItems(sortedAndFiltered.length)
            return sortedAndFiltered.slice(0, visibleItemsCount)
        }, [view, selectedSort, selectedSortDirection, selectedFilter, visibleItemsCount])
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
                <Repository>
                    {sortedAndFilteredPullRequests.map((pr) => (
                        <PullRequest
                            key={pr.id}
                            pullRequest={pr}
                            link={`/overview/${view.id}/${pr.id}`}
                            isSelected={pr.id === overviewItemId}
                        />
                    ))}
                </Repository>
            </>
        )
    }
)

export default PullRequestViewItems
