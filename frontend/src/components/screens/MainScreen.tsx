import { Navigate, useLocation } from 'react-router-dom'
import 'react-toastify/dist/ReactToastify.css'
import 'animate.css'
import { DateTime } from 'luxon'
import { useEventBanners, usePageFocus } from '../../hooks'
import { useFetchPullRequests } from '../../services/api/pull-request.hooks'
import { useFetchExternalTasks, useGetTasks } from '../../services/api/tasks.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { focusModeBackground, noteBackground } from '../../styles/images'
import { CalendarContextProvider } from '../calendar/CalendarContext'
import DragLayer from '../molecules/DragLayer'
import DefaultTemplate from '../templates/DefaultTemplate'
import DailyOverviewView from '../views/DailyOverviewView'
import LinearView from '../views/LinearView'
import NoteListView from '../views/NoteListView'
import PullRequestsView from '../views/PullRequestsView'
import RecurringTasksView from '../views/RecurringTasksView'
import SlackTasksView from '../views/SlackTasksView'
import TaskSection from '../views/TaskSectionView'

const MainScreen = () => {
    const location = useLocation()
    const { data: userInfo } = useGetUserInfo()
    const { isLoading: isTaskSectionsLoading } = useGetTasks()
    useFetchPullRequests()
    useFetchExternalTasks()
    useEventBanners(DateTime.now())
    usePageFocus(true)

    const currentPage = () => {
        switch (location.pathname.split('/')[1]) {
            case 'overview':
                return <DailyOverviewView />
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
                return <DailyOverviewView />
        }
    }

    if (!isTaskSectionsLoading && !userInfo?.agreed_to_terms) return <Navigate to="/tos-summary" />

    return (
        <CalendarContextProvider>
            <link rel="preload" as="image" href={focusModeBackground} />
            <link rel="preload" as="image" href={noteBackground} />
            <DefaultTemplate>
                <>{currentPage()}</>
            </DefaultTemplate>
            <DragLayer />
        </CalendarContextProvider>
    )
}

export default MainScreen
