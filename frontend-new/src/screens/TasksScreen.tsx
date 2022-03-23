import React, { useEffect, useRef, useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import BottomSheet from 'reanimated-bottom-sheet'
import DefaultTemplate from '../components/templates/DefaultTemplate'
import DetailsView from '../components/views/DetailsView'
import Messages from '../components/views/MessagesView'
import TaskBottomSheet from '../components/views/TaskBottomSheetView'
import TaskSection from '../components/views/TaskSectionView'
import Settings from '../components/views/SettingsView'
import { useLocation, Navigate, useParams } from '../services/routing'
import { TTask } from '../utils/types'
import { useGetTasksQuery } from '../services/generalTaskApi'
import { useQuery } from 'react-query'
import { fetchUserInfo } from '../services/queryUtils'
import Loading from '../components/atoms/Loading'
import { KeyboardShortcut } from '../components/atoms/KeyboardShortcuts'

const TasksScreen = () => {
    const [sheetTaskId, setSheetTaskId] = useState('')
    const sheetRef = React.useRef<BottomSheet>(null)
    const location = useLocation()
    const params = useParams()
    const [task, setTask] = useState<TTask | undefined>(undefined)

    const { data: userInfo, isLoading: isUserInfoLoading, isFetching } = useQuery('user_info', fetchUserInfo)
    const { data: taskSections, isLoading: isTaskSectionsLoading } = useGetTasksQuery()

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

    const r = useRef<View>(null)

    if (isTaskSectionsLoading || isFetching || isUserInfoLoading) return <Loading />
    if (!isTaskSectionsLoading && !userInfo.agreed_to_terms) return <Navigate to="/tos-summary" />

    return (
        <>
            <View ref={r}>
                Hi
                <Pressable
                    onPress={() => {
                        r.current?.focus()
                    }}
                >
                    hit k to try/fail to focus on this View
                </Pressable>
                <KeyboardShortcut shortcut="k" onKeyPress={() => r.current?.focus()} />
            </View>
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
