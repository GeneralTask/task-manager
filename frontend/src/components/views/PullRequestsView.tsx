import { PullRequestViewContainer, Repository, RepositoryName } from '../pull-requests/styles'

import PullRequest from '../pull-requests/PullRequest'
import React, { useEffect, useMemo } from 'react'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'
import { SectionHeader } from '../molecules/Header'
import { useFetchPullRequests, useGetPullRequests } from '../../services/api/pull-request.hooks'
import Spinner from '../atoms/Spinner'
import PullRequestDetails from '../details/PullRequestDetails'
import { useNavigate, useParams } from 'react-router-dom'
import useItemSelectionController from '../../hooks/useItemSelectionController'
import { Colors } from '../../styles'
import styled from 'styled-components'

const PullRequestsContainer = styled.div`
    display: flex;
    flex: 1 0;
    border-right: 1px solid ${Colors.gray._300};
    user-select: none;
`

const PullRequestsView = () => {
    const navigate = useNavigate()
    const params = useParams()
    const { data: repositories, isLoading } = useGetPullRequests()
    const { refetch: refetchPullRequests, isFetching: isFetchingPullRequests } = useFetchPullRequests()

    const pullRequests = useMemo(() => repositories?.flatMap((r) => r.pull_requests) ?? [], [repositories])
    useItemSelectionController(pullRequests, (itemId: string) => navigate(`/pull-requests/${itemId}`))

    const expandedPullRequest = useMemo(() => {
        if (pullRequests.length === 0) return null
        return pullRequests.find((pr) => pr.id === params.pullRequest) ?? pullRequests[0]
    }, [params.pullRequest, JSON.stringify(pullRequests)])

    useEffect(() => {
        if (expandedPullRequest) {
            navigate(`/pull-requests/${expandedPullRequest.id}`)
        }
    }, [expandedPullRequest])

    if (!repositories) {
        if (isLoading) {
            return <Spinner />
        } else {
            return <div>No repositories</div>
        }
    }
    return (
        <>
            <PullRequestsContainer>
                <ScrollableListTemplate>
                    <SectionHeader
                        sectionName="Pull Requests"
                        allowRefresh={true}
                        refetch={refetchPullRequests}
                        isRefreshing={isFetchingPullRequests}
                    />
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
            </PullRequestsContainer>
            {expandedPullRequest && <PullRequestDetails pullRequest={expandedPullRequest} />}
        </>
    )
}

export default PullRequestsView
