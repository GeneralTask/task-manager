import { View, Text, StyleSheet, Platform, ScrollView, RefreshControl } from 'react-native'
import { DrawerScreenProps } from '@react-navigation/drawer'
import { ParamListBase } from '@react-navigation/native'
import Cookies from 'js-cookie'
import React, { useEffect, useRef, useState } from 'react'
import BottomSheet from 'reanimated-bottom-sheet'
import { findTaskById } from '../utils/task'
import EditSheet from '../components/organisms/EditSheet'
import CreateNewTask from '../components/organisms/CreateNewTask'
import TasksScreenHeader from '../components/molecules/Header'
import TaskSections from '../components/organisms/Sections'
import { useGetTasksQuery } from '../services/generalTaskApi'
import { Screens, Flex, Colors, Dimensions } from '../styles'
import { useAppDispatch } from '../redux/hooks'
import { setAuthToken } from '../redux/userDataSlice'

interface DrawerParamList extends ParamListBase {
    Tasks: { index: number }
}
const TasksScreen = ({ route }: DrawerScreenProps<DrawerParamList, 'Tasks'>) => {
    const name = route.name
    const [sheetTaskId, setSheetTaskId] = useState('')
    const refetchWasLocal = useRef(false)
    const { data: taskSections, isLoading, refetch, isFetching } = useGetTasksQuery()
    const sectionToDisplay = taskSections?.find(section => section.name === name)
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
    const renderContent = () => {
        if (!taskSections) return
        const task = findTaskById(taskSections, sheetTaskId)
        if (!task) return
        return <EditSheet task={task} />
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
            <BottomSheet
                initialSnap={1}
                ref={sheetRef}
                snapPoints={[Dimensions.editSheetHeight, 0]}
                borderRadius={10}
                renderContent={renderContent}
                onCloseEnd={() => { setSheetTaskId('') }}
            />
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
