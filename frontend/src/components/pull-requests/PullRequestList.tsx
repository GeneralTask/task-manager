import { TPullRequest } from '../../utils/types'
import PullRequest from './PullRequest'
import { useParams } from 'react-router-dom'

interface PullRequestListProps {
    pullRequests: TPullRequest[]
}
const PullRequestList = ({ pullRequests }: PullRequestListProps) => {
    const { pullRequest: selectedPullRequestId } = useParams()
    return (
        <>
            {pullRequests.map((pr) => (
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
