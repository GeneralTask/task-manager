import { useNavigate, useParams } from 'react-router-dom'

import Header from '../pull-requests/Header'
import Loading from '../atoms/Loading'
import PullRequest from '../pull-requests/PullRequest'
import React from 'react'
import ScrollView from '../atoms/ScrollView'
import { SectionHeader } from '../molecules/Header'
import { TRepository } from '../../utils/types'

export const dummyRepositories: TRepository[] = [
    {
        id: 'repo-1',
        name: 'Repository 1',
        pull_requests: [],
    },
    {
        id: 'repo-2',
        name: 'Task Manager',
        pull_requests: [
            {
                id: 'pr-1',
                title: 'Pull Request 1',
                number: 1069,
                status: 'All tests failing',
                author: 'Scott Mai',
                created_at: '2020-04-01T00:00:00.000Z',
                branch: 'scott/fro-193-implementation-of-new-pr-view',
                link: 'https://github.com/octocat/Hello-World/pull/1347',
            },
            {
                id: 'pr-2',
                title: 'Pull Request 1',
                number: 1420,
                status: 'Ready to Merge',
                author: 'Nolan',
                created_at: '2020-04-01T00:00:00.000Z',
                branch: 'scott/fro-193-implementation-of-new-pr-view',
                link: 'https://github.com/octocat/Hello-World/pull/1347',
            },
        ],
    },
]

const PullRequestsView = () => {
    const { repository: repositoryParam } = useParams()
    const navigate = useNavigate()

    const repositories = dummyRepositories

    const repository = repositories.find((repo) => repo.id === repositoryParam)
    if (!repositoryParam && repositories) {
        navigate(`/pull-requests/${repositories[0].id}`)
    }

    if (!repository) {
        return <Loading />
    }

    return (
        <ScrollView>
            <SectionHeader sectionName={repository.name} allowRefresh={false} />
            <Header />
            {repository.pull_requests.map((pr) => (
                <PullRequest key={pr.id} pullRequest={pr} />
            ))}
        </ScrollView>
    )
}

export default PullRequestsView
