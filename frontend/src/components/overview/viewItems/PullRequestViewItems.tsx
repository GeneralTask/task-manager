import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import useGetVisibleItemCount, { PAGE_SIZE } from '../../../hooks/useGetVisibleItemCount'
import SortAndFilterSelectors from '../../../utils/sortAndFilter/SortAndFilterSelectors'
import { SortAndFilterSettings } from '../../../utils/sortAndFilter/types'
import { TPullRequest } from '../../../utils/types'
import PullRequest from '../../pull-requests/PullRequest'
import { Repository } from '../../pull-requests/styles'
import { PaginateTextButton, ViewHeader, ViewName } from '../styles'
import useOverviewItems from '../useOverviewItems'
import EmptyListMessage from './EmptyListMessage'
import { ViewItemsProps } from './viewItems.types'

const PullRequestViewItems = forwardRef(({ view, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
    const { overviewItemId } = useParams()

    const { sortedAndFilteredItems, sortAndFilterSettings } = useOverviewItems(view)
    const items = sortedAndFilteredItems as TPullRequest[]
    const settings = sortAndFilterSettings as SortAndFilterSettings<TPullRequest>

    const [visibleItemsCount, setVisibleItemsCount] = useGetVisibleItemCount(view, items.length)
    const nextPageLength = Math.min(items.length - visibleItemsCount, PAGE_SIZE)

    return (
        <>
            {!hideHeader && (
                <ViewHeader ref={ref}>
                    <ViewName>{view.name}</ViewName>
                </ViewHeader>
            )}
            {view.view_item_ids.length !== 0 && <SortAndFilterSelectors settings={settings} />}
            {items.length === 0 && view.is_linked && <EmptyListMessage list={view} />}
            <Repository>
                {items.slice(0, visibleItemsCount).map((pr) => (
                    <PullRequest
                        key={pr.id}
                        pullRequest={pr}
                        link={`/overview/${view.id}/${pr.id}`}
                        isSelected={pr.id === overviewItemId}
                    />
                ))}
                {visibleItemsCount < items.length && (
                    <PaginateTextButton onClick={() => setVisibleItemsCount(visibleItemsCount + nextPageLength)}>
                        View more ({nextPageLength})
                    </PaginateTextButton>
                )}
            </Repository>
        </>
    )
})

export default PullRequestViewItems
