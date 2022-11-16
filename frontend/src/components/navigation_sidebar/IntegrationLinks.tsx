import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { icons, logos } from '../../styles/images'
import { doesAccountNeedRelinking, isGithubLinked, isLinearLinked, isSlackLinked } from '../../utils/utils'
import NavigationLink from './NavigationLink'

interface IntegrationLinksProps {
    isCollapsed?: boolean
}
const IntegrationLinks = ({ isCollapsed }: IntegrationLinksProps) => {
    const { data: pullRequestRepositories } = useGetPullRequests()
    const { pathname } = useLocation()
    const { data: folders } = useGetTasks()

    const linearTasksCount = useMemo(() => {
        const tasks =
            folders?.filter((section) => !section.is_done && !section.is_trash).flatMap((folder) => folder.tasks) ?? []
        return tasks.filter((task) => task.source.name === 'Linear').length
    }, [folders])

    const slackTasksCount = useMemo(() => {
        const tasks =
            folders?.filter((section) => !section.is_done && !section.is_trash).flatMap((folder) => folder.tasks) ?? []
        return tasks.filter((task) => task.source.name === 'Slack' && (!task.is_done || task.optimisticId)).length
    }, [folders])

    const { data: linkedAccounts } = useGetLinkedAccounts()

    const isGithubIntegrationLinked = isGithubLinked(linkedAccounts || [])
    const isLinearIntegrationLinked = isLinearLinked(linkedAccounts || [])
    const isSlackIntegrationLinked = isSlackLinked(linkedAccounts || [])

    const githubCount = isGithubIntegrationLinked
        ? pullRequestRepositories?.reduce<number>((total, repo) => total + repo.pull_requests.length, 0)
        : undefined
    const linearCount = isLinearIntegrationLinked ? linearTasksCount : undefined
    const slackCount = isSlackIntegrationLinked ? slackTasksCount : undefined
    return (
        <>
            <NavigationLink
                link="/overview"
                title="Overview"
                icon={icons.list}
                isCurrentPage={pathname.split('/')[1] === 'overview'}
                isCollapsed={isCollapsed}
            />
            <NavigationLink
                link="/focus-mode"
                title="Enter Focus Mode"
                icon={icons.headphones}
                isCurrentPage={pathname.split('/')[1] === 'focus-mode'}
                isCollapsed={isCollapsed}
            />
            <NavigationLink
                link="/pull-requests"
                title="GitHub PRs"
                icon={logos.github}
                count={githubCount}
                needsRelinking={doesAccountNeedRelinking(linkedAccounts || [], 'Github')}
                isCurrentPage={pathname.split('/')[1] === 'pull-requests'}
                isCollapsed={isCollapsed}
            />
            <NavigationLink
                link="/linear"
                title="Linear Issues"
                icon={logos.linear}
                count={linearCount}
                needsRelinking={doesAccountNeedRelinking(linkedAccounts || [], 'Linear')}
                isCurrentPage={pathname.split('/')[1] === 'linear'}
                isCollapsed={isCollapsed}
            />
            <NavigationLink
                link="/slack"
                title="Slack"
                icon={logos.slack}
                count={slackCount}
                needsRelinking={doesAccountNeedRelinking(linkedAccounts || [], 'Slack')}
                isCurrentPage={pathname.split('/')[1] === 'slack'}
                isCollapsed={isCollapsed}
            />
        </>
    )
}

export default IntegrationLinks
