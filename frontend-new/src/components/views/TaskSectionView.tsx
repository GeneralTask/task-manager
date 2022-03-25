import { Colors, Flex, Screens, Spacing } from '../../styles'
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useFetchTasksExternalQuery, useGetTasksQuery } from '../../services/generalTaskApi'
import { useNavigate, useParams } from 'react-router-dom'

import CreateNewTask from '../molecules/CreateNewTask'
import { DateTime } from 'luxon'
import DetailsView from './DetailsView'
import EventBanner from '../molecules/EventBanner'
import Loading from '../atoms/Loading'
import { SectionHeader } from '../molecules/Header'
import { TTask } from '../../utils/types'
import Task from '../molecules/Task'
import TaskDropContainer from '../molecules/TaskDropContainer'
import TaskSelectionController from '../molecules/TaskSelectionController'
import { getSectionById } from '../../utils/task'

const TaskSection = () => {
    const { data: taskSections, isLoading, refetch, isFetching } = useGetTasksQuery()
    const fetchTasksExternalQuery = useFetchTasksExternalQuery()

    const refetchWasLocal = useRef(false)
    const routerSection = useParams().section || ''
    const navigate = useNavigate()
    const params = useParams()
    const [selectedTask, setSelectedTask] = useState<TTask | undefined>(undefined)

    //stops fetching animation on iOS from triggering when refetch is called in another component
    if (!isFetching) refetchWasLocal.current = false
    const onRefresh = async () => {
        refetchWasLocal.current = true
        fetchTasksExternalQuery.refetch()
        refetch()
    }

    useEffect(() => {
        if (taskSections && !getSectionById(taskSections, routerSection) && taskSections.length > 0) {
            const firstSectionId = taskSections[0].id
            navigate(`/tasks/${firstSectionId}`)
        }
    })

    useEffect(() => {
        const section = taskSections?.find((section) => section.id === params.section)
        const task = section?.tasks.find((task) => task.id === params.task)
        setSelectedTask(task)
    }, [params, taskSections])

    const refreshControl = <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
    const currentSection = taskSections ? getSectionById(taskSections, routerSection) : undefined

    return (
        <>
            <ScrollView style={styles.container} refreshControl={refreshControl}>
                {Platform.OS === 'web' && currentSection && <TaskSelectionController taskSection={currentSection} />}
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
            {selectedTask && <DetailsView task={selectedTask} />}
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Screens.container,
        ...Flex.column,
        paddingTop: 0,
        backgroundColor: Colors.gray._50,
        minWidth: '550px',
    },
    tasksContent: {
        ...Flex.column,
        marginRight: 10,
        marginLeft: 10,
        marginTop: Platform.OS === 'web' ? Spacing.margin.xLarge : Spacing.margin.large,
        marginBottom: 100,
    },
})

export default TaskSection
