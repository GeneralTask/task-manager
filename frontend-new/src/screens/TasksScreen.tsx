import Cookies from 'js-cookie'
import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native'
import CreateNewTask from '../components/tasks/CreateNewTask'
import TasksScreenHeader from '../components/tasks/Header'
import TaskSections from '../components/tasks/Sections'
import { useAppDispatch } from '../redux/hooks'
import { setAuthToken } from '../redux/userDataSlice'
import { useGetTasksQuery } from '../services/tasks'
import { Screens, Flex } from '../styles'
import { authSignOut } from '../utils/auth'

const TasksScreen = () => {
    const dispatch = useAppDispatch()
    useEffect(() => {
        if (Platform.OS === 'web') dispatch(setAuthToken(Cookies.get('authToken')))
    }, [])
    const { data: taskSections, error, isLoading } = useGetTasksQuery()

    return (
        <View style={styles.container}>
            <TasksScreenHeader />
            <CreateNewTask />
            <TaskSections taskSections={taskSections || []}></TaskSections>
            <Pressable style={styles.signOut} onPress={() => authSignOut(dispatch)}>
                <Text>Sign Out</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Screens.container,
        ...Flex.column,
        paddingTop: Platform.OS === 'web' ? 50 : 20,
        paddingLeft: '7.5%',
        paddingRight: '7.5%'
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
