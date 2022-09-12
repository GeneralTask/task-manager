import { useSortAndFilter } from '../../hooks'
import { SORT_ORDER } from '../../utils/enums'
import { TPullRequest } from '../../utils/types'
import PullRequest from './PullRequest'
import { useParams } from 'react-router-dom'

interface PullRequestListProps {
    pullRequests: TPullRequest[]
    sort?: {
        field: keyof TPullRequest
        direction: SORT_ORDER
    }
    filter?: (item: TPullRequest) => boolean // should return true if item should be included in the filtered list
}
const PullRequestList = ({ pullRequests }: PullRequestListProps) => {
    const { pullRequest: selectedPullRequestId } = useParams()
    const sortedAndFilteredPullRequests = useSortAndFilter({ items: pullRequests })
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
