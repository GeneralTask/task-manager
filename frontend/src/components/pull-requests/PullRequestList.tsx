import { useSortAndFilter } from '../../hooks'
import { Sort } from '../../hooks/useSortAndFilter'
import { TPullRequest } from '../../utils/types'
import PullRequest from './PullRequest'
import { Repository } from './styles'

interface PullRequestListProps {
    pullRequests: TPullRequest[]
    selectedPrId?: string
    sort: Sort<TPullRequest>
    filter?: (item: TPullRequest) => boolean // should return true if item should be included in the filtered list

    overviewViewId?: string // used to determine link to pull request
}
const PullRequestList = ({ pullRequests, selectedPrId, sort, filter, overviewViewId }: PullRequestListProps) => {
    const sortedAndFilteredPullRequests = useSortAndFilter({ items: pullRequests, sort, filter })

    return (
        <>
            {sortedAndFilteredPullRequests.map((pr) => (
                <Repository key={pr.id}>
                    <PullRequest
                        pullRequest={pr}
                        link={overviewViewId ? `/overview/${overviewViewId}/${pr.id}` : `/pull-requests/${pr.id}`}
                        isSelected={pr.id === selectedPrId}
                    />
                </Repository>
            ))}
        </>
    )
}

export default PullRequestList
