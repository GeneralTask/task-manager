import { View, Text, StyleSheet, Platform, ScrollView, RefreshControl } from 'react-native'
import { DrawerScreenProps } from '@react-navigation/drawer'
import { ParamListBase } from '@react-navigation/native'
import Cookies from 'js-cookie'
import React, { useEffect, useRef, useState } from 'react'
import BottomSheet from 'reanimated-bottom-sheet'
import { findTaskById } from '../utils/task'
import EditSheet from '../components/tasks/EditSheet'
import CreateNewTask from '../components/tasks/CreateNewTask'
import TasksScreenHeader from '../components/tasks/Header'
import TaskSections from '../components/tasks/Sections'
import { useGetTasksQuery } from '../services/generalTaskApi'
import { Screens, Flex, Colors } from '../styles'
import { useAppDispatch } from '../redux/hooks'
import { setAuthToken } from '../redux/userDataSlice'

interface DrawerParamList extends ParamListBase {
    Tasks: { index: number }
}
const TasksScreen = ({ route }: DrawerScreenProps<DrawerParamList, 'Tasks'>) => {
    const { index } = route.params
    const refetchWasLocal = useRef(false)
    const { data: taskSections, isLoading, refetch, isFetching } = useGetTasksQuery()
    const [sheetTaskId, setSheetTaskId] = useState('')

    const dispatch = useAppDispatch()
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

    const sheetRef = React.useRef<BottomSheet>(null);

    if (!isFetching) {
        refetchWasLocal.current = false
    }

    const onRefresh = () => {
        refetchWasLocal.current = true
        refetch()
    }
    const LoadingView = <View><Text>Loading...</Text></View>

    const renderContent = () => {
        if (!taskSections) return
        const task = findTaskById(taskSections, sheetTaskId)
        if (!task) return

        return (
            <EditSheet task={task} />
        )
    }
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
                    {isLoading || taskSections == undefined ? LoadingView :
                        <>
                            <TasksScreenHeader title={taskSections[index].name} />
                            {!taskSections[index].is_done && <CreateNewTask section={taskSections[index].id} />}
                            <TaskSections section={taskSections[index]} setSheetTaskId={function (id: string): void {
                                throw new Error('Function not implemented.')
                            }} />
                        </>
                    }
                </View>
            </ScrollView>
            <BottomSheet
                initialSnap={1}
                ref={sheetRef}
                snapPoints={[500, 0]}
                borderRadius={10}
                renderContent={renderContent}
                onCloseEnd={() => {
                    setSheetTaskId('')
                }}
            />
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Screens.container,
        ...Flex.column,
        paddingTop: Platform.OS === 'web' ? 0 : 0,
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
