import React, { useState } from 'react'
import { Platform } from 'react-native'
import BottomSheet from 'reanimated-bottom-sheet'
import DefaultTemplate from '../components/templates/DefaultTemplate'
import DetailsView from '../components/views/DetailsView'
import Messages from '../components/views/MessagesView'
import TaskBottomSheet from '../components/views/TaskBottomSheetView'
import TaskSection from '../components/views/TaskSectionView'
import Settings from '../components/views/SettingsView'
import { Navigate, useLocation } from '../services/routing'
import { useQuery } from 'react-query'
import { fetchUserInfo } from '../services/queryUtils'
import Loading from '../components/atoms/Loading'

const TasksScreen = () => {
    const [sheetTaskId, setSheetTaskId] = useState('')
    const sheetRef = React.useRef<BottomSheet>(null)
    const location = useLocation()

    const { isLoading, data } = useQuery('user_info', fetchUserInfo)

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

    if (!isLoading && !data.agreed_to_terms) {
        return <Navigate to="/tos-summary"></Navigate>
    }
    if (isLoading) {
        return <Loading />
    }
    return (
        <>
            <DefaultTemplate>
                {currentPage}
                <DetailsView />
            </DefaultTemplate>
            {Platform.OS === 'ios' && (
                <TaskBottomSheet sheetTaskId={sheetTaskId} setSheetTaskId={setSheetTaskId} ref={sheetRef} />
            )}
        </>
    )
}

export default TasksScreen
