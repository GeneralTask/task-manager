import { forwardRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Sort } from '../../../hooks/useSortAndFilter'
import { SORT_ORDER } from '../../../utils/enums'
import { TPullRequest } from '../../../utils/types'
import SortSelector from '../../molecules/SortSelector'
import PullRequestList from '../../pull-requests/PullRequestList'
import { PR_SORT_SELECTOR_ITEMS } from '../../pull-requests/constants'
import { ViewHeader, ViewName } from '../styles'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const PullRequestViewItems = forwardRef<HTMLDivElement, ViewItemsProps>(({ view, visibleItemsCount }, ref) => {
    const { overviewItemId } = useParams()
    const [sort, setSort] = useState<Sort<TPullRequest>>({
        ...PR_SORT_SELECTOR_ITEMS.requiredAction.sort,
        direction: SORT_ORDER.DESC,
    })
    return (
        <>
            <ViewHeader ref={ref}>
                <ViewName>{view.name}</ViewName>
                {view.view_items.length > 0 && (
                    <SortSelector items={PR_SORT_SELECTOR_ITEMS} selectedSort={sort} setSelectedSort={setSort} />
                )}
            </ViewHeader>
            {view.view_items.length === 0 && view.is_linked && (
                <EmptyViewItem
                    header="You have no more pull requests!"
                    body="When new pull requests get assigned to you, they will appear here."
                />
            )}
            <PullRequestList
                pullRequests={view.view_items.slice(0, visibleItemsCount)}
                selectedPrId={overviewItemId}
                sort={sort}
                overviewViewId={view.id}
            />
        </>
    )
})

export default PullRequestViewItems
