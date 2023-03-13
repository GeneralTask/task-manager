import { Suspense, lazy, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { usePreviewMode } from '../../hooks'
import { Colors, Spacing } from '../../styles'
import Spinner from '../atoms/Spinner'
import { Header } from '../molecules/Header'

const SuperDashboard = lazy(() => import('../superDashboard/SuperDashboard'))

const FullWidthScroller = styled.div`
    padding: ${Spacing._32} ${Spacing._16} 100px;
    overflow-y: auto;
    width: 100%;
    background-color: ${Colors.background.base};
`

const SuperDashboardView = () => {
    const { isPreviewMode, isLoading } = usePreviewMode()
    const navigate = useNavigate()
    useEffect(() => {
        if (!isLoading && !isPreviewMode) {
            navigate('/overview', { replace: true })
        }
    }, [isPreviewMode, isLoading])

    return (
        <FullWidthScroller>
            <Header folderName="Super Dashboard" />
            <Suspense fallback={<Spinner />}>
                <SuperDashboard />
            </Suspense>
        </FullWidthScroller>
    )
}

export default SuperDashboardView
