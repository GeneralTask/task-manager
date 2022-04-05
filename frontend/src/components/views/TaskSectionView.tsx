import { Colors } from '../../styles'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFetchExternalTasks, useGetTasks } from '../../services/api-query-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import CreateNewTask from '../molecules/CreateNewTask'
import { DateTime } from 'luxon'
import EventBanner from '../molecules/EventBanners'
import Loading from '../atoms/Loading'
import { SectionHeader } from '../molecules/Header'
import { TASK_REFETCH_INTERVAL } from '../../constants'
import Task from '../molecules/Task'
import TaskDetails from '../details/TaskDetails'
import TaskDropContainer from '../molecules/TaskDropContainer'
import { getSectionById } from '../../utils/task'
import { useInterval } from '../../utils/hooks'
import useItemSelectionController from '../../hooks/useItemSelectionController'
import styled from 'styled-components'

const BannerAndSectionContainer = styled.div`
    flex: 1;
`
const ScrollViewMimic = styled.div`
    margin: 40px 10px 0px 10px;
    padding-bottom: 100px;
    overflow: scroll;
    flex: 1;
`
const TaskSectionViewContainer = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    padding-top: 0;
    background-color: ${Colors.gray._50};
    min-width: 550px;
`

const TaskSection = () => {
    const { data: taskSections, isLoading, isFetching } = useGetTasks()
    const { refetch: fetchExternalTasks } = useFetchExternalTasks()

    const refetchWasLocal = useRef(false)
    const routerSection = useParams().section || ''
    const navigate = useNavigate()
    const params = useParams()

    //stops fetching animation on iOS from triggering when refetch is called in another component
    if (!isFetching) refetchWasLocal.current = false
    const onRefresh = useCallback(async () => {
        refetchWasLocal.current = true
        fetchExternalTasks()
    }, [fetchExternalTasks])

    useInterval(onRefresh, TASK_REFETCH_INTERVAL)

    useEffect(() => {
        if (taskSections && !getSectionById(taskSections, routerSection) && taskSections.length > 0) {
            const firstSectionId = taskSections[0].id
            navigate(`/tasks/${firstSectionId}`)
        }
    }, [taskSections, routerSection])

    const expandedTask = useMemo(() => {
        const section = taskSections?.find((section) => section.id === params.section)
        return section?.tasks.find((task) => task.id === params.task)
    }, [params.task, taskSections])

    const currentSection = taskSections ? getSectionById(taskSections, routerSection) : undefined

    const expandTask = useCallback((itemId: string) => {
        if (currentSection) navigate(`/tasks/${currentSection.id}/${itemId}`)
    }, [currentSection])

    useItemSelectionController(currentSection?.tasks ?? [], expandTask)

    return (
        <>
            <BannerAndSectionContainer>
                <EventBanner date={DateTime.now()} />
                <ScrollViewMimic>

                    <TaskSectionViewContainer>
                        {isLoading || !currentSection ? (
                            <Loading />
                        ) : (
                            <>
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
                                                dragDisabled={currentSection.is_done}
                                                index={index}
                                                sectionId={currentSection.id}
                                            />
                                        </TaskDropContainer>
                                    )
                                })}
                            </>
                        )}
                    </TaskSectionViewContainer>
                </ScrollViewMimic>
            </BannerAndSectionContainer>
            {expandedTask && currentSection && <TaskDetails task={expandedTask} />}
        </>
    )
}

export default TaskSection
