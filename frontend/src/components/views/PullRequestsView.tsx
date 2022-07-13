import { PullRequestViewContainer, Repository, RepositoryName } from '../pull-requests/styles'

import PullRequest from '../pull-requests/PullRequest'
import React, { useMemo } from 'react'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'
import { SectionHeader } from '../molecules/Header'
import { useGetPullRequests } from '../../services/api-query-hooks'
import Spinner from '../atoms/Spinner'
import PullRequestDetails from '../details/PullRequestDetails'
import { useNavigate, useParams } from 'react-router-dom'
import useItemSelectionController from '../../hooks/useItemSelectionController'

const PullRequestsView = () => {
    const navigate = useNavigate()
    const params = useParams()
    const { data: repositories, isLoading } = useGetPullRequests()

    const pullRequests = useMemo(() => repositories?.flatMap((r) => r.pull_requests) ?? [], [repositories])
    useItemSelectionController(pullRequests, (itemId: string) => navigate(`/pull-requests/${itemId}`))

    const expandedPullRequest = useMemo(() => {
        if (pullRequests.length === 0) return undefined
        return pullRequests.find((pr) => pr.id === params.pullRequest) ?? pullRequests[0]
    }, [params.pullRequest, JSON.stringify(pullRequests)])

    if (!repositories) {
        if (isLoading) {
            return <Spinner />
        } else {
            return <div>No repositories</div>
        }
    }
    return (
        <>
            <ScrollableListTemplate>
                <SectionHeader sectionName="Pull Requests" allowRefresh={false} />
                <PullRequestViewContainer>
                    {repositories.map((repository) => (
                        <Repository key={repository.id}>
                            <RepositoryName>{repository.name}</RepositoryName>

                            {repository.pull_requests.length === 0 ? (
                                'No pull requests'
                            ) : (
                                <>
                                    {repository.pull_requests.map((pr) => (
                                        <PullRequest
                                            key={pr.id}
                                            pullRequest={pr}
                                            link={`/pull-requests/${pr.id}`}
                                            isSelected={pr === expandedPullRequest}
                                        />
                                    ))}
                                </>
                            )}
                            <br />
                        </Repository>
                    ))}
                </PullRequestViewContainer>
            </ScrollableListTemplate>
            {expandedPullRequest && <PullRequestDetails pullRequest={expandedPullRequest} />}
        </>
    )
}

export default PullRequestsView
