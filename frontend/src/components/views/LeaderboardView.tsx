import { Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import styled from 'styled-components'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Colors, Spacing } from '../../styles'
import Spinner from '../atoms/Spinner'
import OnboardingSplash from '../b2b/leaderboard/OnboardingSplash'
import { Header } from '../molecules/Header'

// const OnboardingSplash = lazy(() => import('../b2b/leaderboard/OnboardingSplash'))

const FullWidthScroller = styled.div`
    padding: ${Spacing._32} ${Spacing._16} 100px;
    overflow-y: auto;
    width: 100%;
    background-color: ${Colors.background.base};
`

const LeaderboardView = () => {
    const { data: userInfo, isLoading: isUserInfoLoading } = useGetUserInfo()
    if (!userInfo?.business_mode_enabled && !isUserInfoLoading) {
        return <Navigate to="/" replace />
    }

    return (
        <FullWidthScroller>
            <Header folderName="Leaderboard" />
            <Suspense fallback={<Spinner />}>
                <OnboardingSplash />
            </Suspense>
        </FullWidthScroller>
    )
}

export default LeaderboardView
