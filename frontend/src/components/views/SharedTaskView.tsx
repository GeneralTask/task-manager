import { Navigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks'
import Spinner from '../atoms/Spinner'

const SharedTask = () => {
    const { isPreviewMode, isLoading } = usePreviewMode()

    if (!isPreviewMode && !isLoading) {
        return <Navigate to="/" replace />
    }
    if (isLoading) {
        return <Spinner />
    }
    return (
        <div>
            <h1>Shared Task</h1>
            ooo weee
        </div>
    )
}

export default SharedTask
