import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import useItemSelectionController from '../../hooks/useItemSelectionController'
import Log from '../../services/api/log'
import { useFetchExternalTasks, useGetTasks, useReorderTask } from '../../services/api/tasks.hooks'
import { Colors } from '../../styles'
import { icons } from '../../styles/images'
import SortAndFilterSelectors from '../../utils/sortAndFilter/SortAndFilterSelectors'
import sortAndFilterItems from '../../utils/sortAndFilter/sortAndFilterItems'
import { TASK_SORT_AND_FILTER_CONFIG } from '../../utils/sortAndFilter/tasks.config'
import useSortAndFilterSettings from '../../utils/sortAndFilter/useSortAndFilterSettings'
import { DropItem, DropType, TTask } from '../../utils/types'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import Spinner from '../atoms/Spinner'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import CreateNewTask from '../molecules/CreateNewTask'
import { SectionHeader } from '../molecules/Header'
import Task from '../molecules/Task'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const TaskSectionContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-right: auto;
    flex-shrink: 0;
    position: relative;
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
    const sectionViewRef = useRef<HTMLDivElement>(null)

    const { data: taskSections, isLoading: isLoadingTasks } = useGetTasks()
    const { mutate: reorderTask } = useReorderTask()
    useFetchExternalTasks()

    const navigate = useNavigate()
    const params = useParams()

    const { section, task } = useMemo(() => {
        const section = taskSections?.find(({ id }) => id === params.section)
        const task = section?.tasks.find(({ id }) => id === params.task)
        return { section, task }
    }, [taskSections, params.task, params.section])

    const [shouldScrollToTask, setShouldScrollToTask] = useState(false)

    const sortAndFilterSettings = useSortAndFilterSettings<TTask>(TASK_SORT_AND_FILTER_CONFIG, section?.id, '_main')
    const { selectedSort, selectedSortDirection, selectedFilter, isLoading: areSettingsLoading } = sortAndFilterSettings
    const sortedTasks = useMemo(() => {
        if (section && (section.is_done || section.is_trash)) return section.tasks
        if (!section || areSettingsLoading) return []
        return sortAndFilterItems({
            items: section.tasks,
            sort: selectedSort,
            sortDirection: selectedSortDirection,
            tieBreakerField: TASK_SORT_AND_FILTER_CONFIG.tieBreakerField,
        })
    }, [section, selectedSort, selectedSortDirection, selectedFilter])

    const [taskIndex, setTaskIndex] = useState(0)

    useEffect(() => {
        if (task) {
            const index = sortedTasks.findIndex(({ id }) => id === task.id)
            setTaskIndex(index === -1 ? 0 : index)
        }
    }, [params.task, params.section, sortedTasks, task])

    const selectTask = useCallback(
        (task: TTask) => {
            setShouldScrollToTask(true)
            if (section) {
                navigate(`/tasks/${section.id}/${task.id}`)
                Log(`task_select_${task.id}`)
            }
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
            } else if (!task && sortedTasks.length > taskIndex) {
                navigate(`/tasks/${section.id}/${sortedTasks[taskIndex].id}`)
            } else if (!task && sortedTasks.length === taskIndex && taskIndex > 0) {
                navigate(`/tasks/${section.id}/${sortedTasks[taskIndex - 1].id}`)
            } else if (!task && sortedTasks.length > 0) {
                navigate(`/tasks/${section.id}/${sortedTasks[0].id}`)
            }
        }
    }, [taskSections, params.section, params.task])

    useItemSelectionController(sortedTasks, selectTask)
    return (
        <>
            <TaskSectionContainer>
                <ScrollableListTemplate ref={sectionScrollingRef}>
                    <TaskSectionViewContainer>
                        {isLoadingTasks || !section || (areSettingsLoading && !section.is_done && !section.is_trash) ? (
                            <Spinner />
                        ) : (
                            <>
                                <SectionHeader sectionName={section.name} taskSectionId={section.id} />
                                {!section.is_done && !section.is_trash && (
                                    <SortAndFilterSelectors settings={sortAndFilterSettings} />
                                )}
                                {!section.is_done && !section.is_trash && <CreateNewTask sectionId={section.id} />}
                                <TasksContainer ref={sectionViewRef}>
                                    {sortedTasks.map((task, index) => (
                                        <ReorderDropContainer
                                            key={task.id}
                                            index={index}
                                            acceptDropType={DropType.TASK}
                                            onReorder={handleReorderTask}
                                            disabled={
                                                sortAndFilterSettings.selectedSort.id !== 'manual' ||
                                                section.is_done ||
                                                section.is_trash
                                            }
                                        >
                                            <Task
                                                task={task}
                                                index={index}
                                                sectionId={section.id}
                                                sectionScrollingRef={sectionScrollingRef}
                                                isSelected={task.id === params.task}
                                                link={`/tasks/${params.section}/${task.id}`}
                                                shouldScrollToTask={shouldScrollToTask}
                                                setShouldScrollToTask={setShouldScrollToTask}
                                            />
                                        </ReorderDropContainer>
                                    ))}
                                </TasksContainer>
                                <ReorderDropContainer
                                    index={sortedTasks.length + 1}
                                    acceptDropType={DropType.TASK}
                                    onReorder={handleReorderTask}
                                    indicatorType="TOP_ONLY"
                                    disabled={
                                        sortAndFilterSettings.selectedSort.id !== 'manual' ||
                                        section.is_done ||
                                        section.is_trash
                                    }
                                >
                                    <BottomDropArea />
                                </ReorderDropContainer>
                            </>
                        )}
                    </TaskSectionViewContainer>
                </ScrollableListTemplate>
            </TaskSectionContainer>
            {task && section ? (
                <TaskDetails task={task} link={`/tasks/${params.section}/${task.id}`} />
            ) : (
                <EmptyDetails icon={icons.check} text="You have no tasks" />
            )}
        </>
    )
}

export default TaskSectionView
