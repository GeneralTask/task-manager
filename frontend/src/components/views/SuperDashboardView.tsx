import { Suspense, lazy, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks'
import Spinner from '../atoms/Spinner'
import { Header } from '../molecules/Header'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const SuperDashboard = lazy(() => import('../superDashboard/SuperDashboard'))

const SuperDashboardView = () => {
    const { isPreviewMode } = usePreviewMode()
    const navigate = useNavigate()
    useEffect(() => {
        if (!isPreviewMode) {
            navigate('/overview', { replace: true })
        }
    }, [isPreviewMode])

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
