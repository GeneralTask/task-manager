import React, { useState } from 'react'
import { Platform } from 'react-native'
import BottomSheet from 'reanimated-bottom-sheet'
import DefaultTemplate from '../components/templates/DefaultTemplate'
import Messages from '../components/views/MessagesView'
import TaskBottomSheet from '../components/views/TaskBottomSheetView'
import TaskSection from '../components/views/TaskSectionView'
import { useLocation } from '../services/routing'

const TasksScreen = () => {
    const [sheetTaskId, setSheetTaskId] = useState('')
    const sheetRef = React.useRef<BottomSheet>(null)
    const location = useLocation()

    const currentPage = location.pathname.startsWith('/tasks') ? <TaskSection /> : <Messages />
    return (
        <>
            <DefaultTemplate>
                {currentPage}
            </DefaultTemplate>
            {
                Platform.OS === 'ios' &&
                <TaskBottomSheet sheetTaskId={sheetTaskId} setSheetTaskId={setSheetTaskId} ref={sheetRef} />
            }
        </>
    )
}

export default TasksScreen
