import React, { useState } from 'react'
import { Platform } from 'react-native'
import { useQuery } from 'react-query'
import BottomSheet from 'reanimated-bottom-sheet'
import Loading from '../components/atoms/Loading'
import DefaultTemplate from '../components/templates/DefaultTemplate'
import Messages from '../components/views/MessagesView'
import Settings from '../components/views/SettingsView'
import TaskBottomSheet from '../components/views/TaskBottomSheetView'
import TaskSection from '../components/views/TaskSectionView'
import { useGetTasksQuery } from '../services/generalTaskApi'
import { fetchUserInfo } from '../services/queryUtils'
import { Navigate, useLocation } from '../services/routing'

const TasksScreen = () => {
    const [sheetTaskId, setSheetTaskId] = useState('')
    const sheetRef = React.useRef<BottomSheet>(null)
    const location = useLocation()

    const { data: userInfo, isLoading: isUserInfoLoading, isFetching } = useQuery('user_info', fetchUserInfo)
    const { isLoading: isTaskSectionsLoading } = useGetTasksQuery()

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
            <DefaultTemplate>{currentPage}</DefaultTemplate>
            {Platform.OS === 'ios' && (
                <TaskBottomSheet sheetTaskId={sheetTaskId} setSheetTaskId={setSheetTaskId} ref={sheetRef} />
            )}
        </>
    )
}

export default TasksScreen
