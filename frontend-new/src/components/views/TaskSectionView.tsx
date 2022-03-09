import { DateTime } from 'luxon'
import React, { useEffect, useRef } from 'react'
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useGetTasksQuery } from '../../services/generalTaskApi'
import { useNavigate, useParams } from '../../services/routing'
import { Colors, Flex, Screens, Shadows } from '../../styles'
import { getSectionById } from '../../utils/task'
import Loading from '../atoms/Loading'
import TaskTemplate from '../atoms/TaskTemplate'
import CreateNewTask from '../molecules/CreateNewTask'
import EventBanner from '../molecules/EventBanner'
import { TasksScreenHeader } from '../molecules/Header'
import Task from '../molecules/Task'

const TaskSection = () => {
    const { data: taskSections, isLoading, refetch, isFetching } = useGetTasksQuery()
    const refetchWasLocal = useRef(false)
    const routerSection = useParams().section || ''
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
    const currentSection = taskSections ? getSectionById(taskSections, routerSection) : undefined

    return (
        <ScrollView style={styles.container} refreshControl={refreshControl}>
            <EventBanner date={DateTime.now()} />
            <View style={styles.tasksContent}>
                {(isLoading || !currentSection) ? <Loading /> :
                    <View>
                        <TasksScreenHeader title={currentSection.name} id={currentSection.id} />
                        {!currentSection.is_done && <CreateNewTask section={currentSection.id} />}
                        {currentSection.tasks.map((task, index) => {
                            return (
                                <TaskTemplate style={styles.shell} key={index}>
                                    <Task task={task} setSheetTaskId={() => null} />
                                </TaskTemplate>
                            )
                        })}
                    </View>
                }
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    shell: {
        marginTop: 20,
        ...Shadows.small
    },
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
})

export default TaskSection
