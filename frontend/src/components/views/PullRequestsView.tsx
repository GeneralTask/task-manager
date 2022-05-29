import Header from '../pull-requests/Header'
import PullRequest from '../pull-requests/PullRequest'
import React from 'react'
import ScrollView from '../atoms/ScrollView'
import { SectionHeader } from '../molecules/Header'
import { TPullRequest } from '../../utils/types'

const dummyData: TPullRequest[] = [
    {
        id: '1',
        title: 'Pull Request 1',
        number: 1069,
        status: 'Ready to Merge',
        author: 'scottmai',
        created_at: '2020-04-01T00:00:00.000Z',
        branch: 'scott/fro-193-implementation-of-new-pr-view',
        link: 'https://github.com/octocat/Hello-World/pull/1347',
    },
]

const PullRequestsView = () => {
    return (
        <ScrollView>
            <SectionHeader sectionName="Pull Requests" allowRefresh={false} />
            <Header />
            {dummyData.map((pr) => (
                <PullRequest key={pr.id} pullRequest={pr} />
            ))}
        </ScrollView>
    )
}

export default PullRequestsView
