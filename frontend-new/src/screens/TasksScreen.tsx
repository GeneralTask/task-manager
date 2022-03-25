import { Navigate, useLocation, useParams } from '../services/routing'
import React, { useEffect, useState } from 'react'

import BottomSheet from 'reanimated-bottom-sheet'
import DefaultTemplate from '../components/templates/DefaultTemplate'
import DetailsView from '../components/views/DetailsView'
import Loading from '../components/atoms/Loading'
import Messages from '../components/views/MessagesView'
import { Platform } from 'react-native'
import Settings from '../components/views/SettingsView'
import { TTask } from '../utils/types'
import TaskBottomSheet from '../components/views/TaskBottomSheetView'
import TaskSection from '../components/views/TaskSectionView'
import { fetchUserInfo } from '../services/queryUtils'
import { setSelectedTaskId } from '../redux/tasksPageSlice'
import { useAppDispatch } from '../redux/hooks'
import { useGetTasksQuery } from '../services/generalTaskApi'
import { useQuery } from 'react-query'

const TasksScreen = () => {
    const [sheetTaskId, setSheetTaskId] = useState('')
    const sheetRef = React.useRef<BottomSheet>(null)
    const location = useLocation()
    const params = useParams()
    const [task, setTask] = useState<TTask | undefined>(undefined)

    const { data: userInfo, isLoading: isUserInfoLoading, isFetching } = useQuery('user_info', fetchUserInfo)
    const { data: taskSections, isLoading: isTaskSectionsLoading } = useGetTasksQuery()

    const dispatch = useAppDispatch()

    useEffect(() => {
        const section = taskSections?.find((section) => section.id === params.section)
        const task = section?.tasks.find((task) => task.id === params.task)
        setTask(task)
        if (params.task) {
            dispatch(setSelectedTaskId(params.task))
        }
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
