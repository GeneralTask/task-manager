import 'react-toastify/dist/ReactToastify.css'
import 'animate.css'

import { PR_REFETCH_INTERVAL, TASK_REFETCH_INTERVAL } from '../../constants'
import { Navigate, useLocation } from 'react-router-dom'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { useFetchExternalTasks, useGetTasks } from '../../services/api/tasks.hooks'
import DefaultTemplate from '../templates/DefaultTemplate'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Loading from '../atoms/Loading'
import PullRequestsView from '../views/PullRequestsView'
import React from 'react'
import Settings from '../views/SettingsView'
import StyledToastContainer from '../atoms/toast/StyledToastContainer'
import TaskSection from '../views/TaskSectionView'
import { cssTransition } from 'react-toastify'
import { useAppSelector } from '../../redux/hooks'
import { useInterval } from '../../hooks'
import OverviewPageView from '../views/OverviewPageView'
import { useFetchPullRequests } from '../../services/api/pull-request.hooks'
import { useSound } from 'use-sound'

const toastAnimation = cssTransition({
    enter: 'animate__animated animate__fadeInRight',
    exit: 'animate__animated animate__fadeOutRight',
})

const MainScreen = () => {
    const expandedCalendar = useAppSelector((state) => state.tasks_page.expanded_calendar)
    const location = useLocation()

    const { data: userInfo, isLoading: isUserInfoLoading, isFetching } = useGetUserInfo()
    const { isLoading: isTaskSectionsLoading } = useGetTasks()

    // Refetch tasks and pull requests independent of current page
    const { refetch: refetchExternalTasks } = useFetchExternalTasks()
    useInterval(refetchExternalTasks, TASK_REFETCH_INTERVAL)
    const { refetch: refetchPullRequests } = useFetchPullRequests()
    useInterval(refetchPullRequests, PR_REFETCH_INTERVAL)

    const dankMode = useAppSelector((state) => state.local.dank_mode)
    const audio = new Audio('./audio/shooting_stars.mp3')
    audio.load()

    const [playbackRate, setPlaybackRate] = React.useState(0.75)

    const [play, { stop }] = useSound('./audio/shooting_stars.mp3', {
        playbackRate,
        // `interrupt` ensures that if the sound starts again before it's
        // ended, it will truncate it. Otherwise, the sound can overlap.
        interrupt: true,
        id: 'shooting_stars',
    })

    const handleClick = () => {
        setPlaybackRate(playbackRate + 0.1)
    }
    window.addEventListener('click', handleClick)

    React.useEffect(() => {
        if (dankMode) {
            document.body.classList.add('dank-mode')
            play()
        } else {
            document.body.classList.remove('dank-mode')
            stop()
        }
        return () => stop()
    }, [dankMode])

    const currentPage = (() => {
        switch (location.pathname.split('/')[1]) {
            case 'overview':
                return <OverviewPageView />
            case 'tasks':
                return <TaskSection />
            case 'pull-requests':
                return <PullRequestsView />
            case 'settings':
                return <Settings />
            default:
                return <OverviewPageView />
        }
    })()

    if (isTaskSectionsLoading || isFetching || isUserInfoLoading) return <Loading />
    if (!isTaskSectionsLoading && !userInfo.agreed_to_terms) return <Navigate to="/tos-summary" />

    return (
        <DndProvider backend={HTML5Backend}>
            <DefaultTemplate>
                <>{expandedCalendar || currentPage}</>
            </DefaultTemplate>
            <StyledToastContainer hideProgressBar position="bottom-right" transition={toastAnimation} />
        </DndProvider>
    )
}

export default MainScreen
