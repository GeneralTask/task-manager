import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFetchExternalTasks, useGetTasks, useMarkTaskDone, useReorderTask } from '../../services/api/tasks.hooks'
import { useNavigate, useParams } from 'react-router-dom'

import { Colors } from '../../styles'
import CreateNewTask from '../molecules/CreateNewTask'
import { DateTime } from 'luxon'
import EventBanner from '../molecules/EventBanners'
import Loading from '../atoms/Loading'
import { SectionHeader } from '../molecules/Header'
import Task from '../molecules/Task'
import TaskDetails from '../details/TaskDetails'
import styled from 'styled-components'
import useItemSelectionController from '../../hooks/useItemSelectionController'
import { DEFAULT_VIEW_WIDTH } from '../../styles/dimensions'
import { DropItem, DropType } from '../../utils/types'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import EmptyDetails from '../details/EmptyDetails'
import { icons } from '../../styles/images'
import { useGTQueryClient } from '../../services/queryUtils'

const BannerAndSectionContainer = styled.div`
    display: flex;
    flex-direction: column;
    border-right: 1px solid ${Colors.background.dark};
    margin-right: auto;
    flex-shrink: 0;
    position: relative;
`
const ScrollViewMimic = styled.div`
    margin: 40px 0px 0px 10px;
    padding-right: 10px;
    overflow-y: auto;
    flex: 1;
    width: ${DEFAULT_VIEW_WIDTH};
`
const TaskSectionViewContainer = styled.div`
    flex: 1;
    display: flex;
    height: 100%;
    flex-direction: column;
    padding-top: 0;
    background-color: ${Colors.background.light};
`
const TasksContainer = styled.div`
    display: flex;
    flex-direction: column;
`
const BottomDropArea = styled.div`
    height: 100px;
`

const TaskSectionView = () => {
    const sectionScrollingRef = useRef<HTMLDivElement | null>(null)
    const bannerTaskSectionRef = useRef<HTMLDivElement | null>(null)
    const sectionViewRef = useRef<HTMLDivElement>(null)
    const queryClient = useGTQueryClient()

    const {
        data: taskSections,
        isLoading: isLoadingTasks,
        isFetching: isFetchingTasks,
        refetch: getTasks,
    } = useGetTasks()
    const { mutate: reorderTask } = useReorderTask()
    const { mutate: markTaskDone } = useMarkTaskDone()
    const { refetch: fetchExternal, isFetching: isFetchingExternal } = useFetchExternalTasks()

    const navigate = useNavigate()
    const params = useParams()

    const refresh = () => {
        getTasks()
        fetchExternal()
    }

    const { section, task } = useMemo(() => {
        const section = taskSections?.find(({ id }) => id === params.section)
        const task = section?.tasks.find(({ id }) => id === params.task)
        return { section, task }
    }, [taskSections, params.task, params.section])

    const selectTask = useCallback(
        (itemId: string) => {
            if (section) navigate(`/tasks/${section.id}/${itemId}`)
        },
        [section]
    )

    const handleReorderTask = useCallback(
        (item: DropItem, dropIndex: number) => {
            if (!section) return
            reorderTask({
                taskId: item.id,
                orderingId: dropIndex,
                dropSectionId: section.id,
            })
        },
        [section]
    )

    const handleMarkTaskComplete = useCallback(
        (taskId: string, isComplete: boolean) => {
            if (!section || queryClient.isMutating({ mutationKey: 'markTaskDone' })) return
            markTaskDone({ taskId, sectionId: section.id, isCompleted: isComplete })
        },
        [section, markTaskDone]
    )

    // deal with invalid routes
    useEffect(() => {
        if (taskSections && taskSections.length > 0 && (!section || !task)) {
            const firstSectionId = taskSections[0].id
            if (!section) {
                navigate(`/tasks/${firstSectionId}/`)
            } else if (!task && section.tasks.length > 0) {
                navigate(`/tasks/${section.id}/${section.tasks[0].id}`)
            }
        }
    }, [taskSections, params.section, params.task])

    useItemSelectionController(section?.tasks ?? [], selectTask)

    return (
        <>
            <BannerAndSectionContainer ref={bannerTaskSectionRef}>
                <EventBanner date={DateTime.now()} />
                <ScrollViewMimic ref={sectionScrollingRef}>
                    <TaskSectionViewContainer>
                        {isLoadingTasks || !section ? (
                            <Loading />
                        ) : (
                            <>
                                <SectionHeader
                                    sectionName={section.name}
                                    allowRefresh={true}
                                    refetch={refresh}
                                    isRefreshing={isFetchingExternal || isFetchingTasks}
                                    taskSectionId={section.id}
                                />
                                {!section.is_done && <CreateNewTask sectionId={section.id} />}
                                <TasksContainer ref={sectionViewRef} data-testid="task-list-container">
                                    {section.tasks.map((task, index) => (
                                        <ReorderDropContainer
                                            key={task.id}
                                            index={index}
                                            acceptDropType={DropType.TASK}
                                            onReorder={handleReorderTask}
                                        >
                                            <Task
                                                task={task}
                                                dragDisabled={section.is_done}
                                                index={index}
                                                sectionId={section.id}
                                                sectionScrollingRef={sectionScrollingRef}
                                                isSelected={task.id === params.task}
                                                link={`/tasks/${params.section}/${task.id}`}
                                                onMarkComplete={handleMarkTaskComplete}
                                            />
                                        </ReorderDropContainer>
                                    ))}
                                </TasksContainer>
                                <ReorderDropContainer
                                    index={section.tasks.length + 1}
                                    acceptDropType={DropType.TASK}
                                    onReorder={handleReorderTask}
                                    indicatorType="TOP_ONLY"
                                >
                                    <BottomDropArea />
                                </ReorderDropContainer>
                            </>
                        )}
                    </TaskSectionViewContainer>
                </ScrollViewMimic>
            </BannerAndSectionContainer>
            {task && section ? (
                <TaskDetails task={task} link={`/tasks/${params.section}/${task.id}`} />
            ) : (
                <EmptyDetails icon={icons.check} text="You have no tasks" />
            )}
        </>
    )
}

export default TaskSectionView
