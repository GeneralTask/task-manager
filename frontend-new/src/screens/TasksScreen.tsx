import { View, Text, StyleSheet, Platform, ScrollView, RefreshControl, Dimensions } from 'react-native'
import { DrawerScreenProps } from '@react-navigation/drawer'
import { ParamListBase } from '@react-navigation/native'
import Cookies from 'js-cookie'
import React, { forwardRef, useEffect, useRef, useState } from 'react'
import BottomSheet from 'reanimated-bottom-sheet'
import { findTaskById } from '../utils/task'
import EditSheet from '../components/organisms/EditSheet'
import CreateNewTask from '../components/organisms/CreateNewTask'
import TasksScreenHeader from '../components/molecules/Header'
import TaskSections from '../components/organisms/Sections'
import { useGetTasksQuery, useModifyTaskMutation } from '../services/generalTaskApi'
import { Screens, Flex, Colors } from '../styles'
import { useAppDispatch } from '../redux/hooks'
import { setAuthToken } from '../redux/userDataSlice'


interface TaskBottomSheetProps {
    sheetTaskId: string,
    setSheetTaskId: (id: string) => void
}
const TaskBottomSheet = forwardRef(({ sheetTaskId, setSheetTaskId }: TaskBottomSheetProps, sheetRef: React.Ref<BottomSheet>) => {
    const { data: taskSections } = useGetTasksQuery()
    const [text, setText] = useState('')
    const currTaskIdRef = useRef('')
    const [modifyTask] = useModifyTaskMutation()

    const renderContent = () => {
        if (!taskSections) return
        const task = findTaskById(taskSections, sheetTaskId)
        if (!task) return
        currTaskIdRef.current = task.id
        return <EditSheet setText={setText} task={task} />
    }

    return (<BottomSheet
        initialSnap={1}
        ref={sheetRef}
        snapPoints={[Dimensions.get('window').height - 100, 0]}
        borderRadius={10}
        renderContent={renderContent}
        onCloseEnd={() => {
            modifyTask({
                id: currTaskIdRef.current,
                body: text
            })
            currTaskIdRef.current = ''
            setSheetTaskId('')
        }}
    />)
})
const TasksScreen = ({ route }: DrawerScreenProps<ParamListBase, 'Tasks'>) => {
    const routeName = route.name
    const [sheetTaskId, setSheetTaskId] = useState('')
    const refetchWasLocal = useRef(false)
    const { data: taskSections, isLoading, refetch, isFetching } = useGetTasksQuery()
    const sectionToDisplay = taskSections?.find(section => section.name === routeName)
    const dispatch = useAppDispatch()
    const sheetRef = React.useRef<BottomSheet>(null)

    useEffect(() => {
        if (Platform.OS === 'web') dispatch(setAuthToken(Cookies.get('authToken')))
    }, [])
    useEffect(() => {
        if (sheetTaskId) {
            sheetRef.current?.snapTo(0)
        }
        else {
            sheetRef.current?.snapTo(1)
        }
    }, [sheetTaskId])

    if (!isFetching) refetchWasLocal.current = false

    const onRefresh = () => {
        refetchWasLocal.current = true
        refetch()
    }

    const LoadingView = <View><Text>Loading...</Text></View>

    return (
        <>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl
                        refreshing={isFetching && !isLoading && refetchWasLocal.current}
                        onRefresh={onRefresh}
                    />
                }>
                <View style={styles.tasksContent}>
                    {isLoading || sectionToDisplay == undefined ? LoadingView :
                        <>
                            <TasksScreenHeader title={sectionToDisplay.name} id={sectionToDisplay.id} />
                            {!sectionToDisplay.is_done && <CreateNewTask section={sectionToDisplay.id} />}
                            <TaskSections section={sectionToDisplay} setSheetTaskId={setSheetTaskId} />
                        </>
                    }
                </View>
            </ScrollView>
            {
                Platform.OS !== 'web' &&
                <TaskBottomSheet sheetTaskId={sheetTaskId} setSheetTaskId={setSheetTaskId} ref={sheetRef} />
            }
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Screens.container,
        ...Flex.column,
        paddingTop: 0,
        backgroundColor: Colors.gray._50
    },
    tasksContent: {
        ...Flex.column,
        marginRight: '7.5%',
        marginLeft: '7.5%',
        marginTop: Platform.OS === 'web' ? 40 : 20,
        marginBottom: 100,
    },
    signOut: {
        ...Platform.select({
            ios: {},
            default: {
                width: '100px',
            }
        }),
        backgroundColor: 'red'
    }
})

export default TasksScreen
