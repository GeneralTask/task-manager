import { useParams } from 'react-router-dom'
import useOverviewLists from './useOverviewLists'

const OverviewDetails = () => {
    const { lists, isLoading } = useOverviewLists()
    const { overviewViewId, overviewItemId, subtaskId } = useParams()
    const selectedList = lists?.find((list) => list.id === overviewViewId)
    const selectedItem = selectedList?.view_items.find((item) => item.id === overviewItemId)

    return <div>hello</div>
}

export default OverviewDetails
