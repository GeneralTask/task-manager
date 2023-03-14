import { Navigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks'
import Spinner from '../atoms/Spinner'
import { BackgroundContainer } from '../molecules/shared_item_page/BackgroundContainer'
import SharedItemHeader from '../molecules/shared_item_page/SharedItemHeader'

const SharedTask = () => {
    const { isPreviewMode, isLoading } = usePreviewMode()

    if (!isPreviewMode && !isLoading) {
        return <Navigate to="/" replace />
    }
    if (isLoading) {
        return <Spinner />
    }
    return (
        <BackgroundContainer>
            <SharedItemHeader sharedType="Tasks" />
            oo wee
        </BackgroundContainer>
    )
}

export default SharedTask
