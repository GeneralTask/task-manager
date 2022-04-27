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
import { useGetTasks, useGetUserInfo } from '../../services/api-query-hooks'

const MainScreen = () => {
    const expandedCalendar = useAppSelector((state) => state.tasks_page.expanded_calendar)
    const location = useLocation()

    const { data: userInfo, isLoading: isUserInfoLoading, isFetching } = useGetUserInfo()
    const { isLoading: isTaskSectionsLoading } = useGetTasks()

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
