import { DateTime } from 'luxon'
import React, { useEffect, useRef } from 'react'
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useNavigate, useParams } from 'react-router-dom'
import { useFetchTasksExternalQuery, useGetTasksQuery } from '../../services/generalTaskApi'
import { Colors, Flex, Screens, Spacing } from '../../styles'
import { getSectionById } from '../../utils/task'
import Loading from '../atoms/Loading'
import CreateNewTask from '../molecules/CreateNewTask'
import EventBanner from '../molecules/EventBanner'
import { SectionHeader } from '../molecules/Header'
import Task from '../molecules/Task'
import TaskDropContainer from '../molecules/TaskDropContainer'

const TaskSection = () => {
    const { data: taskSections, isLoading, refetch, isFetching } = useGetTasksQuery()
    const fetchTasksExternalQuery = useFetchTasksExternalQuery()

    const refetchWasLocal = useRef(false)
    const routerSection = useParams().section || ''
    const navigate = useNavigate()

    //stops fetching animation on iOS from triggering when refetch is called in another component
    if (!isFetching) refetchWasLocal.current = false
    const onRefresh = async () => {
        refetchWasLocal.current = true
        await fetchTasksExternalQuery.refetch()
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
                {isLoading || !currentSection ? (
                    <Loading />
                ) : (
                    <View>
                        <SectionHeader
                            sectionName={currentSection.name}
                            allowRefresh={true}
                            refetch={onRefresh}
                            taskSectionId={currentSection.id}
                        />
                        {!currentSection.is_done && <CreateNewTask section={currentSection.id} />}
                        {currentSection.tasks.map((task, index) => {
                            return (
                                <TaskDropContainer
                                    key={index}
                                    task={task}
                                    taskIndex={index}
                                    sectionId={currentSection.id}
                                >
                                    <Task
                                        task={task}
                                        setSheetTaskId={() => null}
                                        dragDisabled={currentSection.is_done}
                                        index={index}
                                        sectionId={currentSection.id}
                                    />
                                </TaskDropContainer>
                            )
                        })}
                    </View>
                )}
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Screens.container,
        ...Flex.column,
        paddingTop: 0,
        backgroundColor: Colors.gray._50,
    },
    tasksContent: {
        ...Flex.column,
        marginRight: 10,
        marginLeft: 10,
        marginTop: Platform.OS === 'web' ? Spacing.margin.xLarge : 20,
        marginBottom: 100,
    },
})

export default TaskSection
