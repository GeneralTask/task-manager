import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFetchExternalTasks, useGetTasks } from '../../services/api-query-hooks'
import { useNavigate, useParams } from 'react-router-dom'

import { Colors } from '../../styles'
import CreateNewTask from '../molecules/CreateNewTask'
import { DateTime } from 'luxon'
import TaskDropArea from '../molecules/task-dnd/TaskDropArea'
import EventBanner from '../molecules/EventBanners'
import Loading from '../atoms/Loading'
import { SectionHeader } from '../molecules/Header'
import { TASK_REFETCH_INTERVAL } from '../../constants'
import Task from '../molecules/Task'
import TaskDetails from '../details/TaskDetails'
import TaskDropContainer from '../molecules/TaskDropContainer'
import { getSectionById } from '../../utils/task'
import { setSelectedItemId } from '../../redux/tasksPageSlice'
import styled from 'styled-components'
import { useDispatch } from 'react-redux'
import { useInterval } from '../../hooks'
import useItemSelectionController from '../../hooks/useItemSelectionController'
import withTaskDeselect from '../molecules/TaskDeselectWrapper'

const BannerAndSectionContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
`
const ScrollViewMimic = styled.div`
    margin: 40px 0px 0px 10px;
    padding-right: 10px;
    display: flex;
    flex-direction: column;
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
const TasksContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`

const TaskSection = () => {
    const sectionScrollingRef = useRef<HTMLDivElement | null>(null)
    const bannerTaskSectionRef = useRef<HTMLDivElement | null>(null)
    const sectionViewRef = useRef<HTMLDivElement>(null)

    const { data: taskSections, isLoading } = useGetTasks()
    const { refetch: fetchExternalTasks } = useFetchExternalTasks()
    const dispatch = useDispatch()

    useInterval(fetchExternalTasks, TASK_REFETCH_INTERVAL)

    const routerSection = useParams().section || ''
    const navigate = useNavigate()
    const params = useParams()
    const hideDetailsView = useCallback(() => navigate(`/tasks/${params.section}`), [params])

    const currentSection = taskSections ? getSectionById(taskSections, routerSection) : undefined
    const expandTask = useCallback(
        (itemId: string) => {
            if (currentSection) navigate(`/tasks/${currentSection.id}/${itemId}`)
        },
        [currentSection]
    )
    useItemSelectionController(currentSection?.tasks ?? [], expandTask)

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

    useEffect(() => {
        const listener = (event: MouseEvent) => {
            if (!bannerTaskSectionRef.current || !sectionViewRef.current) return
            if (
                bannerTaskSectionRef.current.contains(event.target as Node) &&
                !sectionViewRef.current.contains(event.target as Node)
            ) {
                dispatch(setSelectedItemId(null))
                hideDetailsView()
            }
        }
        document.addEventListener('click', listener, true)
        return () => document.removeEventListener('click', listener, true)
    }, [bannerTaskSectionRef, sectionViewRef, params])

    const WithDeselectDropArea = withTaskDeselect(TaskDropArea)

    return (
        <>
            <BannerAndSectionContainer
                id="testing"
                ref={(node) => {
                    sectionScrollingRef.current = node
                    bannerTaskSectionRef.current = node
                }}
            >
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
                                    refetch={fetchExternalTasks}
                                    taskSectionId={currentSection.id}
                                />
                                {!currentSection.is_done && <CreateNewTask section={currentSection.id} />}
                                <TasksContainer ref={sectionViewRef}>
                                    {currentSection.tasks.map((task, index) => (
                                        <TaskDropContainer
                                            key={task.id}
                                            task={task}
                                            taskIndex={index}
                                            sectionId={currentSection.id}
                                        >
                                            <Task
                                                task={task}
                                                dragDisabled={currentSection.is_done}
                                                index={index}
                                                sectionId={currentSection.id}
                                                sectionScrollingRef={sectionScrollingRef}
                                            />
                                        </TaskDropContainer>
                                    ))}
                                    <WithDeselectDropArea
                                        dropIndex={currentSection.tasks.length + 1}
                                        taskSectionId={currentSection.id}
                                    />
                                </TasksContainer>
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
