import { Suspense, lazy } from 'react'
import { Navigate } from 'react-router-dom'
import styled from 'styled-components'
import { useFetchExternalDashboardData, useGetDashboardData } from '../../services/api/super-dashboard.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Colors, Spacing } from '../../styles'
import Spinner from '../atoms/Spinner'
import { SuperDashboardContextProvider } from '../b2b/superDashboard/SuperDashboardContext'
import { Header } from '../molecules/Header'

const SuperDashboard = lazy(() => import('../b2b/superDashboard/SuperDashboard'))

const FullWidthScroller = styled.div`
    padding: ${Spacing._32} ${Spacing._16} 100px;
    overflow-y: auto;
    width: 100%;
    background-color: ${Colors.background.base};
`

const SuperDashboardView = () => {
    const { data: userInfo, isLoading: isUserInfoLoading } = useGetUserInfo()
    const { data: dashboard, isLoading: isDashboardLoading } = useGetDashboardData()
    useFetchExternalDashboardData()

    if (!userInfo?.business_mode_enabled && !isUserInfoLoading) {
        return <Navigate to="/" replace />
    }
    if (isDashboardLoading || !dashboard || isUserInfoLoading) {
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
