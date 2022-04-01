import React, { useEffect } from 'react'
import CalendarView from '../components/views/CalendarView'
import DefaultTemplate from '../components/templates/DefaultTemplate'
import Messages from '../components/views/MessagesView'
import Settings from '../components/views/SettingsView'
import TaskSection from '../components/views/TaskSectionView'
import { useGetTasks, useGetUserInfo } from '../services/api-query-hooks'
import { useAppDispatch } from '../redux/hooks'
import { setSelectedTaskId } from '../redux/tasksPageSlice'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import Loading from '../components/atoms/Loading'

const TasksScreen = () => {
    const location = useLocation()
    const dispatch = useAppDispatch()
    const params = useParams()

    const { data: userInfo, isLoading: isUserInfoLoading, isFetching } = useGetUserInfo()
    const { isLoading: isTaskSectionsLoading } = useGetTasks()

    useEffect(() => {
        if (params.task) {
            dispatch(setSelectedTaskId(params.task))
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
        <DefaultTemplate>
            <>
                {currentPage}
                <CalendarView />
            </>
        </DefaultTemplate>
    )
}

export default TasksScreen
