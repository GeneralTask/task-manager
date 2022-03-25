import { Navigate, useLocation } from '../services/routing'
import React, { useEffect, useState } from 'react'

import BottomSheet from 'reanimated-bottom-sheet'
import CalendarView from '../components/views/CalendarView'
import DefaultTemplate from '../components/templates/DefaultTemplate'
import Loading from '../components/atoms/Loading'
import Messages from '../components/views/MessagesView'
import { Platform } from 'react-native'
import Settings from '../components/views/SettingsView'
import TaskBottomSheet from '../components/views/TaskBottomSheetView'
import TaskSection from '../components/views/TaskSectionView'
import { fetchUserInfo } from '../services/queryUtils'
import { setSelectedTaskId } from '../redux/tasksPageSlice'
import { useAppDispatch } from '../redux/hooks'
import { useGetTasksQuery } from '../services/generalTaskApi'
import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'

const TasksScreen = () => {
    const [sheetTaskId, setSheetTaskId] = useState('')
    const sheetRef = React.useRef<BottomSheet>(null)
    const location = useLocation()
    const dispatch = useAppDispatch()
    const params = useParams()

    const { data: userInfo, isLoading: isUserInfoLoading, isFetching } = useQuery('user_info', fetchUserInfo)
    const { isLoading: isTaskSectionsLoading } = useGetTasksQuery()


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
        <>
            <DefaultTemplate>
                <>
                    {currentPage}
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
