import React, { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import BottomSheet from 'reanimated-bottom-sheet'
import Loading from '../components/atoms/Loading'
import DefaultTemplate from '../components/templates/DefaultTemplate'
import DetailsView from '../components/views/DetailsView'
import Messages from '../components/views/MessagesView'
import Settings from '../components/views/SettingsView'
import TaskBottomSheet from '../components/views/TaskBottomSheetView'
import TaskSection from '../components/views/TaskSectionView'
import { useGetTasks, useGetUserInfo } from '../services/api-query-hooks'
import { Navigate, useLocation, useParams } from '../services/routing'
import { TTask } from '../utils/types'

const TasksScreen = () => {
    const [sheetTaskId, setSheetTaskId] = useState('')
    const sheetRef = React.useRef<BottomSheet>(null)
    const location = useLocation()
    const params = useParams()
    const [task, setTask] = useState<TTask | undefined>(undefined)

    const { data: userInfo, isLoading: isUserInfoLoading, isFetching } = useGetUserInfo()
    const { data: taskSections, isLoading: isTaskSectionsLoading } = useGetTasks()

    useEffect(() => {
        const section = taskSections?.find((section) => section.id === params.section)
        const task = section?.tasks.find((task) => task.id === params.task)
        setTask(task)
    }, [params, isUserInfoLoading, taskSections])

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
                    {task && <DetailsView task={task} />}
                </>
            </DefaultTemplate>
            {Platform.OS === 'ios' && (
                <TaskBottomSheet sheetTaskId={sheetTaskId} setSheetTaskId={setSheetTaskId} ref={sheetRef} />
            )}
        </>
    )
}

export default TasksScreen
