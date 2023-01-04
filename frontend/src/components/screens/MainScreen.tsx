import { Navigate, useLocation } from 'react-router-dom'
import 'react-toastify/dist/ReactToastify.css'
import 'animate.css'
import { DateTime } from 'luxon'
import { useEventBanners, usePreviewMode } from '../../hooks'
import { useGetNotes } from '../../services/api/notes.hooks'
import { useFetchPullRequests, useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useFetchExternalTasks, useGetTasks } from '../../services/api/tasks.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { focusModeBackground, noteBackground } from '../../styles/images'
import Loading from '../atoms/Loading'
import DragLayer from '../molecules/DragLayer'
import DefaultTemplate from '../templates/DefaultTemplate'
import DailyOverviewView from '../views/DailyOverviewView'
import LinearView from '../views/LinearView'
import NoteListView from '../views/NoteListView'
import OverviewPageView from '../views/OverviewPageView'
import PullRequestsView from '../views/PullRequestsView'
import RecurringTasksView from '../views/RecurringTasksView'
import SlackTasksView from '../views/SlackTasksView'
import TaskSection from '../views/TaskSectionView'

const MainScreen = () => {
    const location = useLocation()
    const { data: userInfo, isLoading: isUserInfoLoading } = useGetUserInfo()
    const { isLoading: isTaskSectionsLoading } = useGetTasks()
    const { isLoading: isPullRequestsLoading } = useGetPullRequests()
    const { isLoading: isNotesLoading } = useGetNotes()
    const { isPreviewMode } = usePreviewMode()
    useFetchPullRequests()
    useFetchExternalTasks()
    useEventBanners(DateTime.now())
    const currentPage = (isPreviewMode: boolean) => {
        switch (location.pathname.split('/')[1]) {
            case 'overview':
                return <OverviewPageView />
            case 'daily-overview':
                if (isPreviewMode) return <DailyOverviewView />
                else return <Navigate to="/overview" />
            case 'recurring-tasks':
                return <RecurringTasksView />
            case 'notes':
                return <NoteListView />
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
    }

    if (isTaskSectionsLoading || isUserInfoLoading || isPullRequestsLoading || isNotesLoading) return <Loading />
    if (!isTaskSectionsLoading && !userInfo?.agreed_to_terms) return <Navigate to="/tos-summary" />

    return (
        <>
            <link rel="preload" as="image" href={focusModeBackground} />
            <link rel="preload" as="image" href={noteBackground} />
            <DefaultTemplate>
                <>{currentPage(isPreviewMode)}</>
            </DefaultTemplate>
            <DragLayer />
        </>
    )
}

export default MainScreen
