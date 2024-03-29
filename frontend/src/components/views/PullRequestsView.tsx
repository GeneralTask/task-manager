import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useItemSelectionController } from '../../hooks'
import Log from '../../services/api/log'
import { useFetchPullRequests, useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { logos } from '../../styles/images'
import SortAndFilterSelectors from '../../utils/sortAndFilter/SortAndFilterSelectors'
import { PR_SORT_AND_FILTER_CONFIG } from '../../utils/sortAndFilter/pull-requests.config'
import sortAndFilterItems from '../../utils/sortAndFilter/sortAndFilterItems'
import useSortAndFilterSettings from '../../utils/sortAndFilter/useSortAndFilterSettings'
import { TPullRequest } from '../../utils/types'
import { doesAccountNeedRelinking, isGithubLinked } from '../../utils/utils'
import ActionsContainer from '../atoms/ActionsContainer'
import Spinner from '../atoms/Spinner'
import { useCalendarContext } from '../calendar/CalendarContext'
import EmptyDetails from '../details/EmptyDetails'
import PullRequestDetails from '../details/PullRequestDetails'
import ConnectIntegration from '../molecules/ConnectIntegration'
import { Header } from '../molecules/Header'
import PullRequest from '../pull-requests/PullRequest'
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
    const { calendarType } = useCalendarContext()

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
                        tieBreakerField: PR_SORT_AND_FILTER_CONFIG.tieBreakerField,
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
        useCallback((pr: TPullRequest) => {
            navigate(`/pull-requests/${pr.id}`)
            Log(`pr_select_${pr.id}`)
        }, [])
    )

    const selectedPullRequest = useMemo(() => {
        if (sortedAndFilteredPullRequests.length === 0 || areSettingsLoading) return null
        return (
            sortedAndFilteredPullRequests.find((pr) => pr.id === params.pullRequest) ?? sortedAndFilteredPullRequests[0]
        )
    }, [params.pullRequest, sortedAndFilteredRepositories])

    const isGithubIntegrationLinked = isGithubLinked(linkedAccounts ?? [])
    const doesNeedRelinking = doesAccountNeedRelinking(linkedAccounts || [], 'GitHub')
    useEffect(() => {
        if (selectedPullRequest) {
            navigate(`/pull-requests/${selectedPullRequest.id}`, { replace: true })
        }
    }, [selectedPullRequest])

    if (!repositories || isLoading || areSettingsLoading) {
        return <Spinner />
    }

    return (
        <>
            <PullRequestsContainer>
                <ScrollableListTemplate>
                    <Header folderName="GitHub Pull Requests" />
                    {doesNeedRelinking && <ConnectIntegration type="github" reconnect />}
                    <ActionsContainer leftActions={<SortAndFilterSelectors settings={sortAndFilterSettings} />} />
                    {!isGithubIntegrationLinked && !isLinkedAccountsLoading ? (
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
            {calendarType === 'day' && (
                <>
                    {selectedPullRequest ? (
                        <PullRequestDetails pullRequest={selectedPullRequest} />
                    ) : (
                        <EmptyDetails icon={logos.github} text="You have no pull requests" />
                    )}
                </>
            )}
        </>
    )
}

export default PullRequestsView
