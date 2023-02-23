import { Ref, forwardRef, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useGetPullRequests } from '../../../services/api/pull-request.hooks'
import SortAndFilterSelectors from '../../../utils/sortAndFilter/SortAndFilterSelectors'
import { PR_SORT_AND_FILTER_CONFIG } from '../../../utils/sortAndFilter/pull-requests.config'
import sortAndFilterItems from '../../../utils/sortAndFilter/sortAndFilterItems'
import useSortAndFilterSettings from '../../../utils/sortAndFilter/useSortAndFilterSettings'
import { TPullRequest } from '../../../utils/types'
import PullRequest from '../../pull-requests/PullRequest'
import { Repository } from '../../pull-requests/styles'
import { ViewHeader, ViewName } from '../styles'
import EmptyListMessage from './EmptyListMessage'
import { ViewItemsProps } from './viewItems.types'

const PullRequestViewItems = forwardRef(
    ({ view, visibleItemsCount, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
        const { overviewItemId } = useParams()
        const sortAndFilterSettings = useSortAndFilterSettings<TPullRequest>(PR_SORT_AND_FILTER_CONFIG, view.id)
        const { data: repositories } = useGetPullRequests()
        const sortedViewItems = useMemo(() => {
            const viewItems =
                repositories
                    ?.flatMap((repo) => repo.pull_requests)
                    ?.filter((pr) => view.view_item_ids.includes(pr.id)) ?? []
            return sortAndFilterItems<TPullRequest>({
                items: viewItems,
                sort: sortAndFilterSettings.selectedSort,
                sortDirection: sortAndFilterSettings.selectedSortDirection,
                tieBreakerField: PR_SORT_AND_FILTER_CONFIG.tieBreakerField,
            })
        }, [repositories, view.view_item_ids, sortAndFilterSettings])

        repositories?.flatMap((repo) => repo.pull_requests)?.filter((pr) => view.view_item_ids.includes(pr.id))

        return (
            <>
                {!hideHeader && (
                    <ViewHeader ref={ref}>
                        <ViewName>{view.name}</ViewName>
                    </ViewHeader>
                )}
                {view.total_view_items !== 0 && <SortAndFilterSelectors settings={sortAndFilterSettings} />}
                {view.view_item_ids.length === 0 && view.is_linked && <EmptyListMessage list={view} />}
                <Repository>
                    {sortedViewItems?.slice(0, visibleItemsCount).map((pr) => (
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
