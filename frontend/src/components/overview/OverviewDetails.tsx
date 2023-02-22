import { useParams } from 'react-router-dom'
import { useGetTasksV4 } from '../../services/api/tasksv4.hooks'
import { icons } from '../../styles/images'
import { TPullRequest } from '../../utils/types'
import EmptyDetails from '../details/EmptyDetails'
import PullRequestDetails from '../details/PullRequestDetails'
import TaskDetails from '../details/TaskDetails'
import useOverviewLists from './useOverviewLists'

const OverviewDetails = () => {
    const { lists, isLoading, flattenedLists } = useOverviewLists()
    const { overviewViewId, overviewItemId, subtaskId } = useParams()
    const selectedList = lists?.find((list) => list.id === overviewViewId)
    const selectedItem = selectedList?.view_items.find((item) => item.id === overviewItemId)
    const { data: allTasks } = useGetTasksV4()

    if (isLoading) return null
    else if (lists.length > 0 && flattenedLists.length === 0)
        return <EmptyDetails icon={icons.check} text="Your lists are all empty" />
    else if (lists.length === 0) return <EmptyDetails icon={icons.list} text="You have no lists" />
    else if (!selectedList || !selectedItem) {
        return null
    } else if (selectedList.type === 'github') return <PullRequestDetails pullRequest={selectedItem as TPullRequest} />
    else {
        const selectedTaskId = subtaskId || overviewItemId
        const task = allTasks?.find((task) => task.id === selectedTaskId)
        if (!task) return null
        return <TaskDetails task={task} />
    }
}

export default OverviewDetails
