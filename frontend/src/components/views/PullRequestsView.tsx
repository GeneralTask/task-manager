import useItemSelectionController from '../../hooks/useItemSelectionController'
import { useFetchPullRequests, useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { logos } from '../../styles/images'
import { TLinkedAccount } from '../../utils/types'
import Flex from '../atoms/Flex'
import Spinner from '../atoms/Spinner'
import EmptyDetails from '../details/EmptyDetails'
import PullRequestDetails from '../details/PullRequestDetails'
import ConnectIntegration from '../molecules/ConnectIntegration'
import { SectionHeader } from '../molecules/Header'
import PullRequestList from '../pull-requests/PullRequestList'
import { Repository, RepositoryName } from '../pull-requests/styles'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'
import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

const PullRequestsContainer = styled.div`
    display: flex;
    flex-direction: column;
`

const isGithubLinkedAccount = (linkedAccounts: TLinkedAccount[]) =>
    linkedAccounts.some((account) => account.name === 'Github')

const PullRequestsView = () => {
    const { data: linkedAccounts, isLoading: isLinkedAccountsLoading } = useGetLinkedAccounts()
    const navigate = useNavigate()
    const params = useParams()
    const { data: repositories, isLoading } = useGetPullRequests()
    useFetchPullRequests()

    const pullRequests = useMemo(() => repositories?.flatMap((r) => r.pull_requests) ?? [], [repositories])
    useItemSelectionController(pullRequests, (itemId: string) => navigate(`/pull-requests/${itemId}`))

    const selectedPullRequest = useMemo(() => {
        if (pullRequests.length === 0) return null
        return pullRequests.find((pr) => pr.id === params.pullRequest) ?? pullRequests[0]
    }, [params.pullRequest, JSON.stringify(pullRequests)])

    const isGithubLinked = isGithubLinkedAccount(linkedAccounts ?? [])
    useEffect(() => {
        if (selectedPullRequest) {
            navigate(`/pull-requests/${selectedPullRequest.id}`)
        }
    }, [selectedPullRequest])

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
                    <Flex justifyContentSpaceBetween alignItemsCenter>
                        <SectionHeader sectionName="Pull Requests" allowRefresh={true} />
                        <div>hi</div>
                    </Flex>
                    {!isGithubLinked && !isLinkedAccountsLoading ? (
                        <ConnectIntegration type="github" />
                    ) : (
                        repositories.map((repository) => (
                            <Repository key={repository.id}>
                                <RepositoryName>{repository.name}</RepositoryName>
                                {repository.pull_requests.length === 0 ? (
                                    'No pull requests'
                                ) : (
                                    <PullRequestList pullRequests={repository.pull_requests} />
                                )}
                                <br />
                            </Repository>
                        ))
                    )}
                </ScrollableListTemplate>
            </PullRequestsContainer>
            {selectedPullRequest ? (
                <PullRequestDetails pullRequest={selectedPullRequest} />
            ) : (
                <EmptyDetails icon={logos.github} text="You have no pull requests" />
            )}
        </>
    )
}

export default PullRequestsView
