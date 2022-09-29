import { useMemo } from 'react'
import sortAndFilterItems from '../../utils/sortAndFilter/sortAndFilterItems'
import { SORT_DIRECTION, Sort } from '../../utils/sortAndFilter/types'
import { TPullRequest } from '../../utils/types'
import PullRequest from './PullRequest'
import { Repository } from './styles'

interface PullRequestListProps {
    pullRequests: TPullRequest[]
    selectedPrId?: string
    sort: Sort<TPullRequest>
    sortDirection: SORT_DIRECTION
    filter?: (item: TPullRequest) => boolean // should return true if item should be included in the filtered list
    overviewViewId?: string // used to determine link to pull request
    visibleItemsCount?: number
}
const PullRequestList = ({
    pullRequests,
    selectedPrId,
    sort,
    sortDirection,
    filter,
    overviewViewId,
    visibleItemsCount,
}: PullRequestListProps) => {
    const sortedAndFilteredPullRequests = useMemo(() => {
        const sortedAndFiltered = sortAndFilterItems({ items: pullRequests, sort, sortDirection, filter })
        return visibleItemsCount ? sortedAndFiltered.slice(0, visibleItemsCount) : sortedAndFiltered
    }, [pullRequests, selectedPrId, sort, sortDirection, filter, visibleItemsCount])

    return (
        <Repository>
            {sortedAndFilteredPullRequests.map((pr) => (
                <PullRequest
                    key={pr.id}
                    pullRequest={pr}
                    link={overviewViewId ? `/overview/${overviewViewId}/${pr.id}` : `/pull-requests/${pr.id}`}
                    isSelected={pr.id === selectedPrId}
                />
            ))}
        </Repository>
    )
}

export default PullRequestList
