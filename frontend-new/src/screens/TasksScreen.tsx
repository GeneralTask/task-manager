import React, { useState } from 'react'
import { Platform } from 'react-native'
import BottomSheet from 'reanimated-bottom-sheet'
import DefaultTemplate from '../components/templates/DefaultTemplate'
import DetailsView from '../components/views/DetailsView'
import Messages from '../components/views/MessagesView'
import TaskBottomSheet from '../components/views/TaskBottomSheetView'
import TaskSection from '../components/views/TaskSectionView'
import Settings from '../components/views/SettingsView'
import { useLocation, useParams } from '../services/routing'

const TasksScreen = () => {
    const [sheetTaskId, setSheetTaskId] = useState('')
    const sheetRef = React.useRef<BottomSheet>(null)
    const location = useLocation()

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

    return (
        <>
            <DefaultTemplate>
                {currentPage}
                <DetailsView />
            </DefaultTemplate>
            {
                Platform.OS === 'ios' &&
                <TaskBottomSheet sheetTaskId={sheetTaskId} setSheetTaskId={setSheetTaskId} ref={sheetRef} />
            }
        </>
    )
}

export default TasksScreen
