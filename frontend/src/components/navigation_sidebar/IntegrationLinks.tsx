import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { useSetting } from '../../hooks'
import useGetActiveTasks from '../../hooks/useGetActiveTasks'
import { useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useGetLinkedAccounts, useGetSettings } from '../../services/api/settings.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Spacing } from '../../styles'
import { icons, logos } from '../../styles/images'
import { PR_SORT_AND_FILTER_CONFIG } from '../../utils/sortAndFilter/pull-requests.config'
import useSortAndFilterSettings from '../../utils/sortAndFilter/useSortAndFilterSettings'
import { TPullRequest } from '../../utils/types'
import {
    doesAccountNeedRelinking,
    isGithubLinked,
    isJiraLinked,
    isLinearLinked,
    isSlackLinked,
} from '../../utils/utils'
import Flex from '../atoms/Flex'
import Skeleton from '../atoms/Skeleton'
import ServiceVisibilityDropdown from '../radix/ServiceVisibilityDropdown'
import Tip from '../radix/Tip'
import NavigationHeader from './NavigationHeader'
import NavigationLink from './NavigationLink'

const ServicesContainer = styled.div<{ isCollapsed: boolean }>`
    display: flex;
    flex-direction: column;
    ${({ isCollapsed }) =>
        isCollapsed &&
        `
        margin-top: ${Spacing._32};
        gap: ${Spacing._8};
    `}
`

interface IntegrationLinksProps {
    isCollapsed?: boolean
}
const IntegrationLinks = ({ isCollapsed }: IntegrationLinksProps) => {
    const { data: userInfo, isLoading: isUserInfoLoading } = useGetUserInfo()
    const { data: pullRequestRepositories } = useGetPullRequests()
    const { isLoading: isSettingsLoading } = useGetSettings()

    const { pathname } = useLocation()
    const { data: activeTasks } = useGetActiveTasks()

    const showGitHubSetting = useSetting('sidebar_github_preference')
    const showLinearSetting = useSetting('sidebar_linear_preference')
    const showSlackSetting = useSetting('sidebar_slack_preference')
    const showJiraSetting = useSetting('sidebar_jira_preference')

    const showGithub = showGitHubSetting.field_value === 'true'
    const showLinear = showLinearSetting.field_value === 'true'
    const showSlack = showSlackSetting.field_value === 'true'
    const showJira = showJiraSetting.field_value === 'true'

    const linearTasksCount = useMemo(
        () => activeTasks?.filter((task) => task.source.name === 'Linear').length,
        [activeTasks]
    )
    const slackTasksCount = useMemo(
        () => activeTasks?.filter((task) => task.source.name === 'Slack').length,
        [activeTasks]
    )
    const jiraTasksCount = useMemo(
        () => activeTasks?.filter((task) => task.source.name === 'Jira').length,
        [activeTasks]
    )

    const { data: linkedAccounts, isLoading: isLinkedAccountsLoading } = useGetLinkedAccounts()

    const isGithubIntegrationLinked = isGithubLinked(linkedAccounts || [])
    const isLinearIntegrationLinked = isLinearLinked(linkedAccounts || [])
    const isSlackIntegrationLinked = isSlackLinked(linkedAccounts || [])
    const isJiraIntegrationLinked = isJiraLinked(linkedAccounts || [])

    const { selectedFilter: pullRequestFilter } = useSortAndFilterSettings<TPullRequest>(PR_SORT_AND_FILTER_CONFIG)
    const githubCount = isGithubIntegrationLinked
        ? pullRequestRepositories?.reduce<number>(
              (total, repo) => total + repo.pull_requests.filter(pullRequestFilter.lambda).length,
              0
          )
        : undefined
    const linearCount = isLinearIntegrationLinked ? linearTasksCount : undefined
    const slackCount = isSlackIntegrationLinked ? slackTasksCount : undefined
    const jiraCount = isJiraIntegrationLinked ? jiraTasksCount : undefined

    return (
        <>
            <Flex gap={isCollapsed ? Spacing._8 : undefined} column>
                {isUserInfoLoading ? (
                    <Skeleton count={4} />
                ) : (
                    <>
                        <Tip shortcutName="goToOverviewPage" side="right">
                            <NavigationLink
                                link="/overview"
                                title="Daily Overview"
                                icon={icons.houseDay}
                                isCurrentPage={pathname.split('/')[1] === 'overview'}
                                isCollapsed={isCollapsed}
                            />
                        </Tip>
                        {userInfo?.business_mode_enabled && (
                            <>
                                <NavigationLink
                                    link="/super-dashboard"
                                    title="Super Dashboard"
                                    icon={icons.chartLineUp}
                                    isCurrentPage={pathname.split('/')[1] === 'super-dashboard'}
                                    isCollapsed={isCollapsed}
                                />
                                <NavigationLink
                                    link="/leaderboard"
                                    title="Leaderboard"
                                    icon={icons.rankingStar}
                                    isCurrentPage={pathname.split('/')[1] === 'leaderboard'}
                                    isCollapsed={isCollapsed}
                                />
                            </>
                        )}
                        <Tip shortcutName="goToRecurringTasksPage" side="right">
                            <NavigationLink
                                link="/recurring-tasks"
                                title="Recurring tasks"
                                icon={icons.arrows_repeat}
                                isCurrentPage={pathname.split('/')[1] === 'recurring-tasks'}
                                isCollapsed={isCollapsed}
                            />
                        </Tip>
                        <Tip shortcutName="goToNotesPage" side="right">
                            <NavigationLink
                                link="/notes"
                                title="Notes"
                                icon={icons.note}
                                isCurrentPage={pathname.split('/')[1] === 'notes'}
                                isCollapsed={isCollapsed}
                            />
                        </Tip>
                        <Tip shortcutName="enterFocusMode" side="right">
                            <NavigationLink
                                link="/focus-mode"
                                title="Enter Focus Mode"
                                icon={icons.headphones}
                                isCurrentPage={pathname.split('/')[1] === 'focus-mode'}
                                isCollapsed={isCollapsed}
                            />
                        </Tip>
                    </>
                )}
            </Flex>
            {!isCollapsed && <NavigationHeader title="Services" rightContent={<ServiceVisibilityDropdown />} />}
            <ServicesContainer isCollapsed={!!isCollapsed}>
                {(isLinkedAccountsLoading || isSettingsLoading) && !isCollapsed && <Skeleton />}
                {showGithub && (
                    <Tip shortcutName="goToGithubPRsPage" side="right">
                        <NavigationLink
                            link="/pull-requests"
                            title="GitHub"
                            icon={logos.github}
                            count={githubCount}
                            needsRelinking={doesAccountNeedRelinking(linkedAccounts || [], 'GitHub')}
                            isCurrentPage={pathname.split('/')[1] === 'pull-requests'}
                            isCollapsed={isCollapsed}
                        />
                    </Tip>
                )}
                {showLinear && (
                    <Tip shortcutName="goToLinearPage" side="right">
                        <NavigationLink
                            link="/linear"
                            title="Linear"
                            icon={logos.linear}
                            count={linearCount}
                            needsRelinking={doesAccountNeedRelinking(linkedAccounts || [], 'Linear')}
                            isCurrentPage={pathname.split('/')[1] === 'linear'}
                            isCollapsed={isCollapsed}
                        />
                    </Tip>
                )}
                {showSlack && (
                    <Tip shortcutName="goToSlackPage" side="right">
                        <NavigationLink
                            link="/slack"
                            title="Slack"
                            icon={logos.slack}
                            count={slackCount}
                            needsRelinking={doesAccountNeedRelinking(linkedAccounts || [], 'Slack')}
                            isCurrentPage={pathname.split('/')[1] === 'slack'}
                            isCollapsed={isCollapsed}
                        />
                    </Tip>
                )}
                {showJira && (
                    <Tip shortcutName="goToJiraPage" side="right">
                        <NavigationLink
                            link="/jira"
                            title="Jira"
                            icon={logos.jira}
                            count={jiraCount}
                            needsRelinking={doesAccountNeedRelinking(linkedAccounts || [], 'Jira')}
                            isCurrentPage={pathname.split('/')[1] === 'jira'}
                            isCollapsed={isCollapsed}
                        />
                    </Tip>
                )}
            </ServicesContainer>
        </>
    )
}

export default IntegrationLinks
