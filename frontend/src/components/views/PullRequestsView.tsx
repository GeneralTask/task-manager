import { PullRequestViewContainer, Repository, RepositoryName } from '../pull-requests/styles'

import Header from '../pull-requests/Header'
import PullRequest from '../pull-requests/PullRequest'
import React from 'react'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'
import { SectionHeader } from '../molecules/Header'
import { TRepository } from '../../utils/types'

export const dummyRepositories: TRepository[] = [
    {
        id: 'repo-1',
        name: 'Task Manager',
        pull_requests: [
            {
                id: 'pr-1',
                title: 'Pull Request 1',
                number: 1069,
                status: {
                    text: 'All tests failing',
                    color: 'red',
                },
                author: 'Scott Mai',
                created_at: '2020-04-01T00:00:00.000Z',
                branch: 'scott/fro-193-implementation-of-new-pr-view',
                link: 'https://github.com/octocat/Hello-World/pull/1347',
            },
            {
                id: 'pr-2',
                title: 'Pull Request 1',
                number: 1420,
                status: {
                    text: 'Ready to Merge',
                    color: 'green',
                },
                author: 'Nolan',
                created_at: '2020-04-01T00:00:00.000Z',
                branch: 'scott/fro-193-implementation-of-new-pr-view',
                link: 'https://github.com/octocat/Hello-World/pull/1347',
            },
        ],
    },
    {
        id: 'repo-2',
        name: 'Repository 2',
        pull_requests: [
            {
                id: 'pr-1',
                title: 'Pull Request 1',
                number: 1069,
                status: {
                    text: 'All tests failing',
                    color: 'yellow',
                },
                author: 'Scott Mai',
                created_at: '2020-04-01T00:00:00.000Z',
                branch: 'scott/fro-193-implementation-of-new-pr-view',
                link: 'https://github.com/octocat/Hello-World/pull/1347',
            },
            {
                id: 'pr-2',
                title: 'Pull Request 1',
                number: 1420,
                status: {
                    text: 'Ready to Merge',
                    color: 'gray',
                },
                author: 'Nolan',
                created_at: '2020-04-01T00:00:00.000Z',
                branch: 'scott/fro-193-implementation-of-new-pr-view',
                link: 'https://github.com/octocat/Hello-World/pull/1347',
            },
        ],
    },
]

const PullRequestsView = () => {
    const repositories = dummyRepositories

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
