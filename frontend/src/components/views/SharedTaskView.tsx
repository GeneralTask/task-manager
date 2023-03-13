import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks'
import Spinner from '../atoms/Spinner'

const SharedTask = () => {
    const { isPreviewMode, isLoading } = usePreviewMode()
    const navigate = useNavigate()

    useEffect(() => {
        if (!isLoading && !isPreviewMode) {
            navigate('/overview', { replace: true })
        }
    }, [isPreviewMode, isLoading])

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
