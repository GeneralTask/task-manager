import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import { usePreviewMode } from '../../../hooks'
import SortAndFilterSelectors from '../../../utils/sortAndFilter/SortAndFilterSelectors'
import { PR_SORT_AND_FILTER_CONFIG } from '../../../utils/sortAndFilter/pull-requests.config'
import useSortAndFilterSettings from '../../../utils/sortAndFilter/useSortAndFilterSettings'
import { TPullRequest } from '../../../utils/types'
import PullRequest from '../../pull-requests/PullRequest'
import { Repository } from '../../pull-requests/styles'
import { ViewHeader, ViewName } from '../styles'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const PullRequestViewItems = forwardRef(
    ({ view, visibleItemsCount, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
        const { overviewItemId } = useParams()
        const sortAndFilterSettings = useSortAndFilterSettings<TPullRequest>(PR_SORT_AND_FILTER_CONFIG, view.id)
        const { isPreviewMode } = usePreviewMode()
        const basePath =
            location.pathname.split('/')[1] === 'daily-overview' && isPreviewMode ? '/daily-overview' : '/overview'

        return (
            <>
                {!hideHeader && (
                    <ViewHeader ref={ref}>
                        <ViewName>{view.name}</ViewName>
                    </ViewHeader>
                )}
                {view.total_view_items !== 0 && <SortAndFilterSelectors settings={sortAndFilterSettings} />}
                {view.view_items.length === 0 && view.is_linked && (
                    <EmptyViewItem
                        header="You have no more pull requests!"
                        body="When new pull requests get assigned to you, they will appear here."
                    />
                )}
                <Repository>
                    {view.view_items.slice(0, visibleItemsCount).map((pr) => (
                        <PullRequest
                            key={pr.id}
                            pullRequest={pr}
                            link={`${basePath}/${view.id}/${pr.id}`}
                            isSelected={pr.id === overviewItemId}
                        />
                    ))}
                </Repository>
            </>
        )
    }
)

export default PullRequestViewItems
