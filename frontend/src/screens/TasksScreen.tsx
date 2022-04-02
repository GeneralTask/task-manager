import { Navigate, useLocation, useParams } from 'react-router-dom'
import React, { useEffect, useRef, useState } from 'react'
import { useGetTasks, useGetUserInfo } from '../services/api-query-hooks'

import BottomSheet from 'reanimated-bottom-sheet'
import Loading from '../components/atoms/Loading'
import DefaultTemplate from '../components/templates/DefaultTemplate'
import CalendarView from '../components/views/CalendarView'
import Loading from '../components/atoms/Loading'
import Messages from '../components/views/MessagesView'
import { Platform } from 'react-native'
import Settings from '../components/views/SettingsView'
import TaskBottomSheet from '../components/views/TaskBottomSheetView'
import TaskSection from '../components/views/TaskSectionView'
import { useAppDispatch, useAppSelector } from '../redux/hooks'
import { setSelectedItemId } from '../redux/tasksPageSlice'
import { useGetTasks, useGetUserInfo } from '../services/api-query-hooks'
import { Navigate, useLocation, useParams } from '../services/routing'

const TasksScreen = () => {
    const [sheetTaskId, setSheetTaskId] = useState('')
    const expandedCalendar = useAppSelector((state) => state.tasks_page.expanded_calendar)
    const sheetRef = useRef<BottomSheet>(null)
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
        <>
            <DefaultTemplate>
                <>
                    {expandedCalendar || currentPage}
                    <CalendarView />
                </>
            </DefaultTemplate>
            {Platform.OS === 'ios' && (
                <TaskBottomSheet sheetTaskId={sheetTaskId} setSheetTaskId={setSheetTaskId} ref={sheetRef} />
            )}
        </>
    )
}

export default TasksScreen
