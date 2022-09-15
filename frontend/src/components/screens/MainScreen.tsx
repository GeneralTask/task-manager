import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Navigate, useLocation } from 'react-router-dom'
import 'react-toastify/dist/ReactToastify.css'
import 'animate.css'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import Loading from '../atoms/Loading'
import StyledToastContainer from '../atoms/toast/StyledToastContainer'
import DragLayer from '../molecules/DragLayer'
import DefaultTemplate from '../templates/DefaultTemplate'
import OverviewPageView from '../views/OverviewPageView'
import PullRequestsView from '../views/PullRequestsView'
import Settings from '../views/SettingsView'
import TaskSection from '../views/TaskSectionView'

const MainScreen = () => {
    const location = useLocation()
    const { data: userInfo, isLoading: isUserInfoLoading } = useGetUserInfo()
    const { isLoading: isTaskSectionsLoading } = useGetTasks()

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

    if (isTaskSectionsLoading || isUserInfoLoading) return <Loading />
    if (!isTaskSectionsLoading && !userInfo.agreed_to_terms) return <Navigate to="/tos-summary" />

    return (
        <DndProvider backend={HTML5Backend}>
            <DefaultTemplate>
                <>{currentPage}</>
            </DefaultTemplate>
            <StyledToastContainer />
            <DragLayer />
        </DndProvider>
    )
}

export default MainScreen
