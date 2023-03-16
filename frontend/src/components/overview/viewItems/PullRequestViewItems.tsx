import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import SortAndFilterSelectors from '../../../utils/sortAndFilter/SortAndFilterSelectors'
import { PR_SORT_AND_FILTER_CONFIG } from '../../../utils/sortAndFilter/pull-requests.config'
import useSortAndFilterSettings from '../../../utils/sortAndFilter/useSortAndFilterSettings'
import { TPullRequest } from '../../../utils/types'
import ActionsContainer from '../../atoms/ActionsContainer'
import PullRequest from '../../pull-requests/PullRequest'
import { Repository } from '../../pull-requests/styles'
import { ViewHeader, ViewName } from '../styles'
import EmptyListMessage from './EmptyListMessage'
import { ViewItemsProps } from './viewItems.types'

const PullRequestViewItems = forwardRef(
    ({ view, visibleItemsCount, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
        const { overviewItemId } = useParams()
        const sortAndFilterSettings = useSortAndFilterSettings<TPullRequest>(PR_SORT_AND_FILTER_CONFIG, view.id)

        return (
            <>
                {!hideHeader && (
                    <ViewHeader ref={ref}>
                        <ViewName>{view.name}</ViewName>
                    </ViewHeader>
                )}
                {view.total_view_items !== 0 && (
                    <ActionsContainer leftActions={<SortAndFilterSelectors settings={sortAndFilterSettings} />} />
                )}
                {view.view_items.length === 0 && view.is_linked && <EmptyListMessage list={view} />}
                <Repository>
                    {view.view_items.slice(0, visibleItemsCount).map((pr) => (
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
