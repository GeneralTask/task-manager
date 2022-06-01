import { useNavigate, useParams } from 'react-router-dom'

import Header from '../pull-requests/Header'
import Loading from '../atoms/Loading'
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
        pull_requests: [],
    },
]

const PullRequestsView = () => {
    const { repository: repositoryParam } = useParams()
    const navigate = useNavigate()

    const repositories = dummyRepositories

    const repository = repositories.find((repo) => repo.id === repositoryParam)
    if (!repository && repositories.length > 0) {
        navigate(`/pull-requests/${repositories[0].id}`)
    }

    if (!repository) {
        return <Loading />
    }

    return (
        <ScrollableListTemplate>
            <SectionHeader sectionName={repository.name} allowRefresh={false} />
            <Header />
            {repository.pull_requests.map((pr) => (
                <PullRequest key={pr.id} pullRequest={pr} />
            ))}
        </ScrollableListTemplate>
    )
}

export default PullRequestsView
