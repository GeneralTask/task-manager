import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useItemSelectionController } from '../../hooks'
import { useFetchPullRequests, useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useGetLinkedAccounts, useGetSettings } from '../../services/api/settings.hooks'
import { Spacing } from '../../styles'
import { logos } from '../../styles/images'
import usePRSortAndFilter from '../../utils/sortAndFilter/useSortAndFilterSettings'
import { isGithubLinkedAccount } from '../../utils/utils'
import Spinner from '../atoms/Spinner'
import EmptyDetails from '../details/EmptyDetails'
import PullRequestDetails from '../details/PullRequestDetails'
import ConnectIntegration from '../molecules/ConnectIntegration'
import { SectionHeader } from '../molecules/Header'
import SortSelector from '../molecules/SortSelector'
import PullRequestList from '../pull-requests/PullRequestList'
import { PR_SORT_AND_FILTER_CONFIG } from '../pull-requests/constants'
import { Repository, RepositoryName } from '../pull-requests/styles'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const PullRequestsContainer = styled.div`
    display: flex;
    flex-direction: column;
`
const MarginBottonContainer = styled.div`
    margin-bottom: ${Spacing._16};
`

const PullRequestsView = () => {
    const { sortItems, selectedSort, setSelectedSort, selectedSortDirection, setSelectedSortDirection } =
        usePRSortAndFilter(PR_SORT_AND_FILTER_CONFIG)
    const { data: linkedAccounts, isLoading: isLinkedAccountsLoading } = useGetLinkedAccounts()
    const { isLoading: areSettingsLoading } = useGetSettings()
    const navigate = useNavigate()
    const params = useParams()
    const { data: repositories, isLoading } = useGetPullRequests()
    useFetchPullRequests()

    const pullRequests = useMemo(() => repositories?.flatMap((r) => r.pull_requests) ?? [], [repositories])
    useItemSelectionController(
        pullRequests,
        useCallback((itemId: string) => navigate(`/pull-requests/${itemId}`), [])
    )

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

    if (!repositories || isLoading || areSettingsLoading) {
        return <Spinner />
    }

    return (
        <>
            <PullRequestsContainer>
                <ScrollableListTemplate>
                    <SectionHeader sectionName="GitHub Pull Requests" />
                    <MarginBottonContainer>
                        <SortSelector
                            items={sortItems}
                            selectedSort={selectedSort}
                            setSelectedSort={setSelectedSort}
                            selectedSortDirection={selectedSortDirection}
                            setSelectedSortDirection={setSelectedSortDirection}
                        />
                    </MarginBottonContainer>
                    {!isGithubLinked && !isLinkedAccountsLoading ? (
                        <ConnectIntegration type="github" />
                    ) : (
                        repositories.map((repository) => (
                            <Repository key={repository.id}>
                                <RepositoryName>{repository.name}</RepositoryName>
                                {repository.pull_requests.length === 0 ? (
                                    'No pull requests'
                                ) : (
                                    <PullRequestList
                                        pullRequests={repository.pull_requests}
                                        selectedPrId={params.pullRequest}
                                        sort={selectedSort}
                                        sortDirection={selectedSortDirection}
                                    />
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
