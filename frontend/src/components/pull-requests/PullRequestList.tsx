import { useParams } from 'react-router-dom'
import { useSortAndFilter } from '../../hooks'
import { Sort } from '../../hooks/useSortAndFilter'
import { TPullRequest } from '../../utils/types'
import PullRequest from './PullRequest'

interface PullRequestListProps {
    pullRequests: TPullRequest[]
    sort: Sort<TPullRequest>
    filter?: (item: TPullRequest) => boolean // should return true if item should be included in the filtered list
}
const PullRequestList = ({ pullRequests, sort }: PullRequestListProps) => {
    const { pullRequest: selectedPullRequestId } = useParams()
    const sortedAndFilteredPullRequests = useSortAndFilter({ items: pullRequests, sort })
    return (
        <>
            {sortedAndFilteredPullRequests.map((pr) => (
                <PullRequest
                    key={pr.id}
                    pullRequest={pr}
                    link={`/pull-requests/${pr.id}`}
                    isSelected={pr.id === selectedPullRequestId}
                />
            ))}
        </>
    )
}

export default PullRequestList
