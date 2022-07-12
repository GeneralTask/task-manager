import { PullRequestViewContainer, Repository, RepositoryName } from '../pull-requests/styles'

import Header from '../pull-requests/Header'
import PullRequest from '../pull-requests/PullRequest'
import React from 'react'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'
import { SectionHeader } from '../molecules/Header'
import { useGetPullRequests } from '../../services/api-query-hooks'
import Spinner from '../atoms/Spinner'

const PullRequestsView = () => {
    const { data: repositories, isLoading } = useGetPullRequests()

    if (!repositories) {
        if (isLoading) {
            return <Spinner />
        } else {
            return <div>No repositories</div>
        }
    }

    return (
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
                                <Header />
                                {repository.pull_requests.map((pr) => (
                                    <PullRequest key={pr.id} pullRequest={pr} />
                                ))}
                            </>
                        )}
                        <br />
                    </Repository>
                ))}
            </PullRequestViewContainer>
        </ScrollableListTemplate>
    )
}

export default PullRequestsView
