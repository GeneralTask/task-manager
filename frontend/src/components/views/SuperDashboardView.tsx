import { Suspense, lazy } from 'react'
import { Navigate } from 'react-router-dom'
import styled from 'styled-components'
import { usePreviewMode } from '../../hooks'
import { useGetDashboardData } from '../../services/api/super-dashboard.hooks'
import { Colors, Spacing } from '../../styles'
import Spinner from '../atoms/Spinner'
import { Header } from '../molecules/Header'
import { SuperDashboardContextProvider } from '../superDashboard/SuperDashboardContext'

const SuperDashboard = lazy(() => import('../superDashboard/SuperDashboard'))

const FullWidthScroller = styled.div`
    padding: ${Spacing._32} ${Spacing._16} 100px;
    overflow-y: auto;
    width: 100%;
    background-color: ${Colors.background.base};
`

const SuperDashboardView = () => {
    const { isPreviewMode, isLoading: isPreviewModeLoading } = usePreviewMode()
    const { data: dashboard, isLoading: isDashboardLoading } = useGetDashboardData()

    if (!isPreviewMode && !isPreviewModeLoading) {
        return <Navigate to="/" replace />
    }
    if (isPreviewModeLoading || isDashboardLoading || !dashboard) {
        return <Spinner />
    }

    return (
        <SuperDashboardContextProvider dashboard={dashboard}>
            <FullWidthScroller>
                <Header folderName="Super Dashboard" />
                <Suspense fallback={<Spinner />}>
                    <SuperDashboard />
                </Suspense>
            </FullWidthScroller>
        </SuperDashboardContextProvider>
    )
}

export default SuperDashboardView
