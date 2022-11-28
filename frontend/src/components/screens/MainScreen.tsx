import { Navigate, useLocation } from 'react-router-dom'
import 'react-toastify/dist/ReactToastify.css'
import 'animate.css'
import { DateTime } from 'luxon'
import { useEventBanners } from '../../hooks'
import { useFetchPullRequests, useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useFetchExternalTasks, useGetTasks } from '../../services/api/tasks.hooks'
import { useGetTasksV4 } from '../../services/api/tasksv4.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { focusModeBackground } from '../../styles/images'
import Loading from '../atoms/Loading'
import DragLayer from '../molecules/DragLayer'
import DefaultTemplate from '../templates/DefaultTemplate'
import LinearView from '../views/LinearView'
import OverviewPageView from '../views/OverviewPageView'
import PullRequestsView from '../views/PullRequestsView'
import RecurringTasksView from '../views/RecurringTasksView'
import SlackTasksView from '../views/SlackTasksView'
import TaskSection from '../views/TaskSectionView'

const MainScreen = () => {
    const location = useLocation()
    const { data: userInfo, isLoading: isUserInfoLoading } = useGetUserInfo()
    const { isLoading: areTaskSectionsLoading } = useGetTasks()
    const { isLoading: areTasksLoading } = useGetTasksV4()
    const { isLoading: arePullRequestsLoading } = useGetPullRequests()
    useFetchPullRequests()
    useFetchExternalTasks()
    useEventBanners(DateTime.now())

    const currentPage = (() => {
        switch (location.pathname.split('/')[1]) {
            case 'overview':
                return <OverviewPageView />
            case 'recurring-tasks':
                return <RecurringTasksView />
            case 'tasks':
                return <TaskSection />
            case 'pull-requests':
                return <PullRequestsView />
            case 'linear':
                return <LinearView />
            case 'slack':
                return <SlackTasksView />
            default:
                return <OverviewPageView />
        }
    })()

    if (!isUserInfoLoading && !userInfo?.agreed_to_terms) return <Navigate to="/tos-summary" />
    if (areTaskSectionsLoading || arePullRequestsLoading || areTasksLoading || isUserInfoLoading) return <Loading />

    return (
        <>
            <link rel="preload" as="image" href={focusModeBackground} />
            <DefaultTemplate>
                <>{currentPage}</>
            </DefaultTemplate>
            <DragLayer />
        </>
    )
}

export default MainScreen
