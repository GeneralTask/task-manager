import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useItemSelectionController } from '../../hooks'
import { useFetchPullRequests, useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { logos } from '../../styles/images'
import SortAndFilterSelectors from '../../utils/sortAndFilter/SortAndFilterSelectors'
import sortAndFilterItems from '../../utils/sortAndFilter/sortAndFilterItems'
import useSortAndFilterSettings from '../../utils/sortAndFilter/useSortAndFilterSettings'
import { TPullRequest } from '../../utils/types'
import { isGithubLinkedAccount } from '../../utils/utils'
import Spinner from '../atoms/Spinner'
import EmptyDetails from '../details/EmptyDetails'
import PullRequestDetails from '../details/PullRequestDetails'
import ConnectIntegration from '../molecules/ConnectIntegration'
import { SectionHeader } from '../molecules/Header'
import PullRequest from '../pull-requests/PullRequest'
import { PR_SORT_AND_FILTER_CONFIG } from '../pull-requests/constants'
import { Repository, RepositoryName } from '../pull-requests/styles'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const PullRequestsContainer = styled.div`
    display: flex;
    flex-direction: column;
`

const PullRequestsView = () => {
    const sortAndFilterSettings = useSortAndFilterSettings<TPullRequest>(PR_SORT_AND_FILTER_CONFIG)
    const { selectedSort, selectedSortDirection, selectedFilter, isLoading: areSettingsLoading } = sortAndFilterSettings
    const { data: linkedAccounts, isLoading: isLinkedAccountsLoading } = useGetLinkedAccounts()
    const navigate = useNavigate()
    const params = useParams()
    const { data: repositories, isLoading } = useGetPullRequests()
    useFetchPullRequests()

    // Repos in the same order they are passed in as, with pull requests sorted and filtered
    const sortedAndFilteredRepositories = useMemo(
        () =>
            repositories
                ?.flatMap((repo) => ({
                    ...repo,
                    pull_requests: sortAndFilterItems({
                        items: repo.pull_requests,
                        sort: selectedSort,
                        sortDirection: selectedSortDirection,
                        filter: selectedFilter,
                    }),
                }))
                .filter((repo) => repo.pull_requests.length > 0) ?? [],
        [repositories, selectedSort, selectedSortDirection, selectedFilter]
    )

    const sortedAndFilteredPullRequests = useMemo(
        () => sortedAndFilteredRepositories?.flatMap((repo) => repo.pull_requests) ?? [],
        [sortedAndFilteredRepositories]
    )

    useItemSelectionController(
        sortedAndFilteredPullRequests,
        useCallback((itemId: string) => navigate(`/pull-requests/${itemId}`), [])
    )

    const selectedPullRequest = useMemo(() => {
        if (sortedAndFilteredPullRequests.length === 0 || areSettingsLoading) return null
        return (
            sortedAndFilteredPullRequests.find((pr) => pr.id === params.pullRequest) ?? sortedAndFilteredPullRequests[0]
        )
    }, [params.pullRequest, sortedAndFilteredRepositories])

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
                    <SectionHeader sectionName="GitHub PRs" />
                    <SortAndFilterSelectors settings={sortAndFilterSettings} />
                    {!isGithubLinked && !isLinkedAccountsLoading ? (
                        <ConnectIntegration type="github" />
                    ) : (
                        sortedAndFilteredRepositories.map((repository) => (
                            <Repository key={repository.id}>
                                <RepositoryName>{repository.name}</RepositoryName>
                                {repository.pull_requests.length === 0 ? (
                                    'No pull requests'
                                ) : (
                                    <Repository>
                                        {repository.pull_requests.map((pr) => (
                                            <PullRequest
                                                key={pr.id}
                                                pullRequest={pr}
                                                link={`/pull-requests/${pr.id}`}
                                                isSelected={pr.id === selectedPullRequest?.id}
                                            />
                                        ))}
                                    </Repository>
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
