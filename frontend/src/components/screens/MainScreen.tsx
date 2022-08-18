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

    const [playbackRate, setPlaybackRate] = React.useState(0.75)

    const [play, { stop }] = useSound('http://www.lejdesigns.com/rankedPUGs/sounds/sponge.mp3', {
        playbackRate,
        interrupt: true,
    })

    const handleClick = () => {
        setPlaybackRate(playbackRate + 0.1)
        play()
        console.log('FASTER', playbackRate)
    }

    React.useEffect(() => {
        console.log('PLAYBACK RATE', playbackRate)
        if (dankMode) {
            document.body.classList.add('dank-mode')
            play()
            window.addEventListener('click', handleClick)
        } else {
            stop()
            setPlaybackRate(0.75)
        }
        return () => {
            console.log('UNMOUNT')
            document.body.classList.remove('dank-mode')
            stop()
            window.removeEventListener('click', handleClick)
        }
    }, [dankMode, playbackRate])

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
