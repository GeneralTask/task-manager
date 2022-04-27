import React, { useEffect } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import Loading from '../atoms/Loading'
import DefaultTemplate from '../templates/DefaultTemplate'
import CalendarView from '../views/CalendarView'
import MessagesView from '../views/MessagesView'
import Settings from '../views/SettingsView'
import TaskSection from '../views/TaskSectionView'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setSelectedItemId } from '../../redux/tasksPageSlice'
import { useGetInfiniteThreads, useGetTasks, useGetUserInfo } from '../../services/api-query-hooks'

const MainScreen = () => {
    const expandedCalendar = useAppSelector((state) => state.tasks_page.expanded_calendar)
    const location = useLocation()
    const dispatch = useAppDispatch()
    const params = useParams()
    useGetInfiniteThreads()

    const { data: userInfo, isLoading: isUserInfoLoading, isFetching } = useGetUserInfo()
    const { isLoading: isTaskSectionsLoading } = useGetTasks()

    useEffect(() => {
        if (!params.task) return
        dispatch(setSelectedItemId(params.task))
    }, [params])

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
