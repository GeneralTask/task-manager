import { useParams } from 'react-router-dom'
import { useGetMeetingPreparationTasks } from '../../services/api/meeting-preparation-tasks.hooks'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useGetTasksV4 } from '../../services/api/tasks.hooks'
import { icons } from '../../styles/images'
import EmptyDetails from '../details/EmptyDetails'
import PullRequestDetails from '../details/PullRequestDetails'
import TaskDetails from '../details/TaskDetails'

const OverviewDetails = () => {
    const { data: lists, isLoading } = useGetOverviewViews()
    const { overviewViewId, overviewItemId, subtaskId } = useParams()
    const selectedList = lists?.find((list) => list.id === overviewViewId)
    const { data: repositories, isLoading: isGetPullRequestLoading } = useGetPullRequests()
    const { data: allTasks, isLoading: isGetAllTasksLoading } = useGetTasksV4()
    const { data: meetingPreparationTasks, isLoading: isMeetingPreparationTasksLoading } =
        useGetMeetingPreparationTasks()

    if (!lists || isLoading || isGetPullRequestLoading || isGetAllTasksLoading || isMeetingPreparationTasksLoading)
        return null
    else if (lists.length > 0 && lists.flatMap((l) => l.view_item_ids).length === 0)
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
    } else if (selectedList.type === 'meeting_preparation') {
        const selectedTaskId = subtaskId || overviewItemId
        const selectedTask = meetingPreparationTasks?.find((task) => task.id === selectedTaskId)
        if (!selectedTask) return null
        return <TaskDetails task={selectedTask} />
    } else {
        const selectedTaskId = subtaskId || overviewItemId
        const selectedTask = allTasks?.find((task) => task.id === selectedTaskId)
        if (!selectedTask) return null
        return <TaskDetails task={selectedTask} />
    }
}

export default OverviewDetails
