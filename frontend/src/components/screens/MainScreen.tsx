import React from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Navigate, useLocation } from 'react-router-dom'
import Loading from '../atoms/Loading'
import DefaultTemplate from '../templates/DefaultTemplate'
import CalendarView from '../views/CalendarView'
import MessagesView from '../views/MessagesView'
import Settings from '../views/SettingsView'
import TaskSection from '../views/TaskSectionView'
import { useAppSelector } from '../../redux/hooks'
import {
    useFetchExternalTasks,
    useFetchMessages,
    useGetInfiniteThreads,
    useGetTasks,
    useGetUserInfo,
} from '../../services/api-query-hooks'
import { useInterval } from '../../hooks'
import { MESSAGES_REFETCH_INTERVAL, TASK_REFETCH_INTERVAL } from '../../constants'

const MainScreen = () => {
    const expandedCalendar = useAppSelector((state) => state.tasks_page.expanded_calendar)
    const location = useLocation()

    const { data: userInfo, isLoading: isUserInfoLoading, isFetching } = useGetUserInfo()
    const { isLoading: isTaskSectionsLoading } = useGetTasks()
    useGetInfiniteThreads()

    // Refetch tasks and messages independent of current page
    const { refetch: refetchExternalTasks } = useFetchExternalTasks()
    useInterval(refetchExternalTasks, TASK_REFETCH_INTERVAL)
    const { refetch: refetchMessages } = useFetchMessages()
    useInterval(refetchMessages, MESSAGES_REFETCH_INTERVAL)

    const currentPage = (() => {
        switch (location.pathname.split('/')[1]) {
            case 'tasks':
                return <TaskSection />
            case 'messages':
                return <MessagesView />
            case 'settings':
                return <Settings />
            default:
                return <TaskSection />
        }
    })()

    if (isTaskSectionsLoading || isFetching || isUserInfoLoading) return <Loading />
    if (!isTaskSectionsLoading && !userInfo.agreed_to_terms) return <Navigate to="/tos-summary" />

    return (
        <DndProvider backend={HTML5Backend}>
            <DefaultTemplate>
                <>
                    {expandedCalendar || currentPage}
                    <CalendarView />
                </>
            </DefaultTemplate>
        </DndProvider>
    )
}

export default MainScreen
