import React from 'react'
import { View, Text, StyleSheet, Platform, ScrollView, RefreshControl } from 'react-native'
import CreateNewTask from '../components/tasks/CreateNewTask'
import TasksScreenHeader from '../components/tasks/Header'
import TaskSections from '../components/tasks/Sections'
import { useAppDispatch } from '../redux/hooks'
import { useGetTasksQuery } from '../services/generalTaskApi'
import { Screens, Flex, Colors } from '../styles'


const TasksScreen = ({ route }: any) => {
    const { index } = route.params

    const { data: taskSections, isLoading, refetch, isFetching } = useGetTasksQuery()

    const LoadingView = <View><Text>Loading...</Text></View>

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={isFetching && !isLoading}
                    onRefresh={refetch}
                />
            }>
            <View style={styles.tasksContent}>
                {/* current hardcoded section */}
                {isLoading || taskSections == undefined ? LoadingView :
                    <>
                        <TasksScreenHeader title={taskSections[index].name} />
                        <CreateNewTask section={taskSections[index].id} />
                        <TaskSections section={taskSections[index]} />
                    </>
                }
            </View>
        </ScrollView>
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
