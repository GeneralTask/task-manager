import Cookies from 'js-cookie'
import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, RefreshControl } from 'react-native'
import CreateNewTask from '../components/tasks/CreateNewTask'
import TasksScreenHeader from '../components/tasks/Header'
import TaskSections from '../components/tasks/Sections'
import { useAppDispatch } from '../redux/hooks'
import { setAuthToken } from '../redux/userDataSlice'
import { useGetTasksQuery } from '../services/tasks'
import { Screens, Flex } from '../styles'
import { authSignOut } from '../utils/auth'


const TasksScreen = () => {
    const { data: taskSections, error, isLoading, refetch, isFetching } = useGetTasksQuery()
    const dispatch = useAppDispatch()
    useEffect(() => {
        if (Platform.OS === 'web') dispatch(setAuthToken(Cookies.get('authToken')))
    }, [])

    let LoadingView = <View><Text>Loading...</Text></View>

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={isFetching}
                    onRefresh={refetch}
                />
            }>
            <View style={styles.tasksContent}>
                <TasksScreenHeader />
                <CreateNewTask />
                {isLoading || taskSections == undefined ? LoadingView : <TaskSections section={taskSections[0]} />}
                <Pressable style={styles.signOut} onPress={() => authSignOut(dispatch)}>
                    <Text>Sign Out</Text>
                </Pressable>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Screens.container,
        ...Flex.column,
        paddingTop: Platform.OS === 'web' ? 0 : 0,

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
