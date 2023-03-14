import { Navigate, useParams } from 'react-router-dom'
import { usePreviewMode } from '../../hooks'
import { useGetSharedTask } from '../../services/api/tasks.hooks'
import Spinner from '../atoms/Spinner'
import { BackgroundContainer } from '../molecules/shared_item_page/BackgroundContainer'
import SharedItemBody from '../molecules/shared_item_page/SharedItemBody'
import SharedItemHeader from '../molecules/shared_item_page/SharedItemHeader'

const SharedTask = () => {
    const { isPreviewMode, isLoading: isPreviewModeLoading } = usePreviewMode()
    const { taskId } = useParams()

    const { data: task, isLoading } = useGetSharedTask({ id: taskId ?? '' })

    if (!isPreviewMode && !isPreviewModeLoading) {
        return <Navigate to="/" replace />
    }
    if (isLoading) {
        return <Spinner />
    }
    return (
        <BackgroundContainer>
            <SharedItemHeader sharedType="Tasks" />
            <SharedItemBody>{task?.title}</SharedItemBody>
        </BackgroundContainer>
    )
}

export default SharedTask
