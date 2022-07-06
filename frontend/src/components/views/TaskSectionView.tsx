import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFetchExternalTasks, useGetTasks, useReorderTask } from '../../services/api-query-hooks'
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
import ScheduleGapFiller from '../atoms/scheduleGapFiller/ScheduleGapFiller'
import { DEFAULT_VIEW_WIDTH } from '../../styles/dimensions'
import { DropItem, DropType } from '../../utils/types'
import ReorderDropContainer from '../atoms/ReorderDropContainer'

const BannerAndSectionContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-right: auto;
    flex-shrink: 0;
    position: relative;
    user-select: none;
`
const ScrollViewMimic = styled.div`
    margin: 40px 0px 0px 10px;
    padding-right: 10px;
    overflow-y: auto;
    flex: 1;
`
const TaskSectionViewContainer = styled.div`
    flex: 1;
    display: flex;
    height: 100%;
    flex-direction: column;
    padding-top: 0;
    background-color: ${Colors.gray._50};
    width: ${DEFAULT_VIEW_WIDTH};
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

    const { data: taskSections, isLoading } = useGetTasks()
    const { mutate: reorderTask } = useReorderTask()
    const { refetch: fetchExternalTasks, isFetching: isRefetchingTasks } = useFetchExternalTasks()

    const navigate = useNavigate()
    const params = useParams()

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
    }, [taskSections, params.section])

    useItemSelectionController(section?.tasks ?? [], selectTask)

    return (
        <>
            <BannerAndSectionContainer ref={bannerTaskSectionRef}>
                <EventBanner date={DateTime.now()} />
                <ScrollViewMimic ref={sectionScrollingRef}>
                    <TaskSectionViewContainer>
                        {isLoading || !section ? (
                            <Loading />
                        ) : (
                            <>
                                <SectionHeader
                                    sectionName={section.name}
                                    allowRefresh={true}
                                    refetch={fetchExternalTasks}
                                    isRefetching={isRefetchingTasks}
                                    taskSectionId={section.id}
                                />
                                {!section.is_done && <CreateNewTask section={section.id} />}
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
                                            />
                                        </ReorderDropContainer>
                                    ))}
                                </TasksContainer>
                                <ReorderDropContainer
                                    index={section.tasks.length + 1}
                                    acceptDropType={DropType.TASK}
                                    onReorder={handleReorderTask}
                                    isLast
                                >
                                    <BottomDropArea />
                                </ReorderDropContainer>
                            </>
                        )}
                    </TaskSectionViewContainer>
                </ScrollViewMimic>
            </BannerAndSectionContainer>
            {task && section && <TaskDetails task={task} />}
            <ScheduleGapFiller />
        </>
    )
}

export default TaskSectionView
