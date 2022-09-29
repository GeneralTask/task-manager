import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Navigate, useLocation } from 'react-router-dom'
import 'react-toastify/dist/ReactToastify.css'
import 'animate.css'
import { DateTime } from 'luxon'
import { useEventBanners } from '../../hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { focusModeBackground } from '../../styles/images'
import Loading from '../atoms/Loading'
import DragLayer from '../molecules/DragLayer'
import DefaultTemplate from '../templates/DefaultTemplate'
import LinearView from '../views/LinearView'
import OverviewPageView from '../views/OverviewPageView'
import PullRequestsView from '../views/PullRequestsView'
import Settings from '../views/SettingsView'
import SlackTasksView from '../views/SlackTasksView'
import TaskSection from '../views/TaskSectionView'

const MainScreen = () => {
    const location = useLocation()
    const { data: userInfo, isLoading: isUserInfoLoading } = useGetUserInfo()
    const { isLoading: isTaskSectionsLoading } = useGetTasks()
    useEventBanners(DateTime.now())

    const currentPage = (() => {
        switch (location.pathname.split('/')[1]) {
            case 'overview':
                return <OverviewPageView />
            case 'tasks':
                return <TaskSection />
            case 'pull-requests':
                return <PullRequestsView />
            case 'linear':
                return <LinearView />
            case 'slack':
                return <SlackTasksView />
            case 'settings':
                return <Settings />
            default:
                return <OverviewPageView />
        }
    })()

    if (isTaskSectionsLoading || isUserInfoLoading) return <Loading />
    if (!isTaskSectionsLoading && !userInfo.agreed_to_terms) return <Navigate to="/tos-summary" />

    return (
        <DndProvider backend={HTML5Backend}>
            <link rel="preload" as="image" href={focusModeBackground} />
            <DefaultTemplate>
                <>{currentPage}</>
            </DefaultTemplate>
            <DragLayer />
        </DndProvider>
    )
}

export default MainScreen
