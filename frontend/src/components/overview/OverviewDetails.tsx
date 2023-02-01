import { useParams } from 'react-router-dom'
import { icons } from '../../styles/images'
import { TPullRequest, TTask } from '../../utils/types'
import EmptyDetails from '../details/EmptyDetails'
import PullRequestDetails from '../details/PullRequestDetails'
import TaskDetails from '../details/TaskDetails'
import { useGetCorrectlyOrderedOverviewLists } from '../views/DailyOverviewView'

const OverviewDetails = () => {
    const { lists, isLoading } = useGetCorrectlyOrderedOverviewLists()
    const { overviewViewId, overviewItemId, subtaskId } = useParams()
    const selectedList = lists?.find((list) => list.id === overviewViewId)
    const selectedItem = selectedList?.view_items.find((item) => item.id === overviewItemId)

    if (isLoading) return null
    else if (!selectedList || !selectedItem) {
        return null
    } else if (!lists?.length) return <EmptyDetails icon={icons.list} text="You have no views" />
    else if (selectedList.type === 'github') return <PullRequestDetails pullRequest={selectedItem as TPullRequest} />
    else {
        const subtask = selectedItem?.sub_tasks?.find((subtask) => subtask.id === subtaskId)
        return <TaskDetails task={selectedItem as TTask} subtask={subtask} />
    }
}

export default OverviewDetails
