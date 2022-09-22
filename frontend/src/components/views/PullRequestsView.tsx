import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useItemSelectionController } from '../../hooks'
import { Sort } from '../../hooks/useSortAndFilter'
import { useFetchPullRequests, useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { Spacing } from '../../styles'
import { logos } from '../../styles/images'
import { SORT_ORDER } from '../../utils/enums'
import { TPullRequest } from '../../utils/types'
import { isGithubLinkedAccount } from '../../utils/utils'
import Flex from '../atoms/Flex'
import Spinner from '../atoms/Spinner'
import EmptyDetails from '../details/EmptyDetails'
import PullRequestDetails from '../details/PullRequestDetails'
import ConnectIntegration from '../molecules/ConnectIntegration'
import { SectionHeader } from '../molecules/Header'
import SortSelector from '../molecules/SortSelector'
import PullRequestList from '../pull-requests/PullRequestList'
import { PR_SORT_SELECTOR_ITEMS } from '../pull-requests/constants'
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
    const [sort, setSort] = useState<Sort<TPullRequest>>({
        ...PR_SORT_SELECTOR_ITEMS.requiredAction.sort,
        direction: SORT_ORDER.DESC,
    })
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
                        <SectionHeader sectionName="Pull Requests" />
                        <MarginBottonContainer>
                            <SortSelector
                                items={PR_SORT_SELECTOR_ITEMS}
                                selectedSort={sort}
                                setSelectedSort={setSort}
                            />
                        </MarginBottonContainer>
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
                                    <PullRequestList
                                        pullRequests={repository.pull_requests}
                                        selectedPrId={params.pullRequest}
                                        sort={sort}
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
