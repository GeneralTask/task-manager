import React, { useEffect } from 'react'
import { useMemo } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import Loading from '../components/atoms/Loading'
import DefaultTemplate from '../components/templates/DefaultTemplate'
import CalendarView from '../components/views/CalendarView'
import Messages from '../components/views/MessagesView'
import Settings from '../components/views/SettingsView'
import TaskSection from '../components/views/TaskSectionView'
import { useAppDispatch, useAppSelector } from '../redux/hooks'
import { setSelectedItemId } from '../redux/tasksPageSlice'
import { useGetTasks, useGetUserInfo } from '../services/api-query-hooks'

const TasksScreen = () => {
    const memoizedCalendar = useMemo(() => <CalendarView />, [])
    const expandedCalendar = useAppSelector((state) => state.tasks_page.expanded_calendar)
    const location = useLocation()
    const dispatch = useAppDispatch()
    const params = useParams()

    const { data: userInfo, isLoading: isUserInfoLoading, isFetching } = useGetUserInfo()
    const { isLoading: isTaskSectionsLoading } = useGetTasks()

    useEffect(() => {
        if (params.task) {
            dispatch(setSelectedItemId(params.task))
        }
    }, [params])

    const currentPage = (() => {
        switch (location.pathname.split('/')[1]) {
            case 'tasks':
                return <TaskSection />
            case 'messages':
                return <Messages />
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
                    {memoizedCalendar}
                </>
            </DefaultTemplate>
        </DndProvider>
    )
}

export default TasksScreen
