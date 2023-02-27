import { useParams } from 'react-router-dom'
import { useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useGetTasksV4 } from '../../services/api/tasks.hooks'
import { icons } from '../../styles/images'
import EmptyDetails from '../details/EmptyDetails'
import PullRequestDetails from '../details/PullRequestDetails'
import TaskDetails from '../details/TaskDetails'
import useOverviewLists from './useOverviewLists'

const OverviewDetails = () => {
    const { lists, isLoading, flattenedLists } = useOverviewLists()
    const { overviewViewId, overviewItemId, subtaskId } = useParams()
    const selectedList = lists?.find((list) => list.id === overviewViewId)
    const { data: repositories, isLoading: isGetPullRequestLoading } = useGetPullRequests()
    const { data: allTasks, isLoading: isGetAllTasksLoading } = useGetTasksV4()

    if (isLoading || isGetPullRequestLoading || isGetAllTasksLoading) return null
    else if (lists.length > 0 && flattenedLists.length === 0)
        return <EmptyDetails icon={icons.check} text="Your lists are all empty" />
    else if (lists.length === 0) return <EmptyDetails icon={icons.list} text="You have no lists" />
    else if (!selectedList) {
        return null
    } else if (selectedList.type === 'github') {
        const selectedPullRequest = repositories
            ?.flatMap((repo) => repo.pull_requests)
            .find((item) => item.id === overviewItemId)
        if (!selectedPullRequest) return null
        return <PullRequestDetails pullRequest={selectedPullRequest} />
    } else {
        const selectedTaskId = subtaskId || overviewItemId
        const selectedTask = allTasks?.find((task) => task.id === selectedTaskId)
        if (!selectedTask) return null
        return <TaskDetails task={selectedTask} />
    }
}

export default OverviewDetails
