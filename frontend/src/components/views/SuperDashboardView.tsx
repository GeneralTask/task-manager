import { Suspense, lazy, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks'
import Spinner from '../atoms/Spinner'
import { Header } from '../molecules/Header'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const SuperDashboard = lazy(() => import('../superDashboard/SuperDashboard'))

const SuperDashboardView = () => {
    const { isPreviewMode, isLoading } = usePreviewMode()
    const navigate = useNavigate()
    useEffect(() => {
        if (!isLoading && !isPreviewMode) {
            navigate('/overview', { replace: true })
        }
    }, [isPreviewMode, isLoading])

    return (
        <ScrollableListTemplate width="100%">
            <Header folderName="Super Dashboard" />
            <Suspense fallback={<Spinner />}>
                <SuperDashboard />
            </Suspense>
        </ScrollableListTemplate>
    )
}

export default SuperDashboardView
