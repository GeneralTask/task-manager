import { View, StyleSheet, Platform, ScrollView, RefreshControl } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import BottomSheet from 'reanimated-bottom-sheet'
import { getSectionById } from '../utils/task'
import CreateNewTask from '../components/molecules/CreateNewTask'
import TasksScreenHeader from '../components/molecules/Header'
import TaskSections from '../components/views/TaskSectionView'
import { useGetTasksQuery } from '../services/generalTaskApi'
import { Screens, Flex, Colors } from '../styles'
import Loading from '../components/atoms/Loading'
import { useParams } from '../services/routing'
import TaskBottomSheet from '../components/views/TaskBottomSheetView'
import DefaultTemplate from '../components/templates/DefaultTemplate'
import { useNavigate } from 'react-router-dom'

const TasksScreen = () => {
    const [sheetTaskId, setSheetTaskId] = useState('')
    const refetchWasLocal = useRef(false)
    const sheetRef = React.useRef<BottomSheet>(null)
    const routerSection = useParams().section || ''
    const { data: taskSections, isLoading, refetch, isFetching } = useGetTasksQuery()
    const navigate = useNavigate()

    //stops fetching animation on iOS from triggering when refetch is called in another component
    if (!isFetching) refetchWasLocal.current = false
    const onRefresh = () => {
        refetchWasLocal.current = true
        refetch()
    }

    useEffect(() => {
        if (taskSections && !getSectionById(taskSections, routerSection) && taskSections.length > 0) {
            const firstSectionId = taskSections[0].id
            navigate(`/tasks/${firstSectionId}`)
        }
    })

    const refreshControl = <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
    const currentSection = taskSections ? getSectionById(taskSections, routerSection) : null

    return (
        <>
            <DefaultTemplate>
                <ScrollView style={styles.container} refreshControl={refreshControl}>
                    <View style={styles.tasksContent}>
                        {
                            (isLoading || !currentSection) ?
                                <Loading /> :
                                <View>
                                    <TasksScreenHeader title={currentSection.name} id={currentSection.id} />
                                    {!currentSection.is_done && <CreateNewTask section={currentSection.id} />}
                                    <TaskSections section={currentSection} setSheetTaskId={setSheetTaskId} />
                                </View>
                        }
                    </View>
                </ScrollView>
            </DefaultTemplate>
            {
                Platform.OS === 'ios' &&
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
