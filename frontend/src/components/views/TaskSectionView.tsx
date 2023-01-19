import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import { useKeyboardShortcut } from '../../hooks'
import { useNavigateToTask } from '../../hooks'
import useItemSelectionController from '../../hooks/useItemSelectionController'
import Log from '../../services/api/log'
import { useCreateTask, useFetchExternalTasks, useGetTasks, useReorderTask } from '../../services/api/tasks.hooks'
import { Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import SortAndFilterSelectors from '../../utils/sortAndFilter/SortAndFilterSelectors'
import sortAndFilterItems from '../../utils/sortAndFilter/sortAndFilterItems'
import { TASK_SORT_AND_FILTER_CONFIG } from '../../utils/sortAndFilter/tasks.config'
import useSortAndFilterSettings from '../../utils/sortAndFilter/useSortAndFilterSettings'
import { DropItem, DropType, TTask } from '../../utils/types'
import { getTaskIndexFromSections } from '../../utils/utils'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import Spinner from '../atoms/Spinner'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import CreateNewItemInput from '../molecules/CreateNewItemInput'
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
const ActionsContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${Spacing._4};
`

const TaskSectionView = () => {
    const [shouldScrollToTask, setShouldScrollToTask] = useState(false)
    const sectionScrollingRef = useRef<HTMLDivElement | null>(null)
    const sectionViewRef = useRef<HTMLDivElement>(null)

    const { data: taskSections, isLoading: isLoadingTasks } = useGetTasks()
    const { mutate: createTask } = useCreateTask()
    const { mutate: reorderTask } = useReorderTask()
    useFetchExternalTasks()

    const navigate = useNavigate()
    const params = useParams()
    const navigateToTask = useNavigateToTask()

    const section = useMemo(() => taskSections?.find(({ id }) => id === params.section), [taskSections, params.section])

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

    const task = useMemo(
        () => sortedTasks.find(({ id }) => id === params.task) ?? (sortedTasks.length > 0 ? sortedTasks[0] : undefined),
        [sortedTasks, params.task]
    )
    const subtask = useMemo(() => task?.sub_tasks?.find(({ id }) => id === params.subtaskId), [task, params.subtaskId])

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
                navigate(`/tasks/${section.id}/${task.id}`, { replace: true })
                Log(`task_select_${task.id}`)
            }
        },
        [section]
    )
    const handleReorderTask = useCallback(
        (item: DropItem, dropIndex: number) => {
            if (!section) return
            reorderTask(
                {
                    id: item.id,
                    orderingId: dropIndex,
                    dropSectionId: section.id,
                },
                item.task?.optimisticId
            )
        },
        [section]
    )

    // deal with invalid routes
    useEffect(() => {
        if (taskSections && taskSections.length > 0 && (!section || !task)) {
            const firstSectionId = taskSections[0].id
            if (!section) {
                navigate(`/tasks/${firstSectionId}/`, { replace: true })
            } else if (!task && sortedTasks.length > taskIndex) {
                navigate(`/tasks/${section.id}/${sortedTasks[taskIndex].id}`, { replace: true })
            } else if (!task && sortedTasks.length === taskIndex && taskIndex > 0) {
                navigate(`/tasks/${section.id}/${sortedTasks[taskIndex - 1].id}`, { replace: true })
            } else if (!task && sortedTasks.length > 0) {
                navigate(`/tasks/${section.id}/${sortedTasks[0].id}`, { replace: true })
            }
        }
    }, [taskSections, params.section, params.task])

    useItemSelectionController(sortedTasks, selectTask)

    useKeyboardShortcut(
        'moveTaskDown',
        useCallback(() => {
            if (!task || !section || taskIndex === section.tasks.length - 1) return
            reorderTask({
                id: task.id,
                orderingId: task.id_ordering + 2,
                dropSectionId: section.id,
            })
        }, [task, section, sortedTasks, taskIndex]),
        selectedSort.id !== 'manual'
    )
    useKeyboardShortcut(
        'moveTaskUp',
        useCallback(() => {
            if (!task || !section || taskIndex === 0) return
            reorderTask({
                id: task.id,
                orderingId: task.id_ordering - 1,
                dropSectionId: section.id,
            })
        }, [task, section, sortedTasks, taskIndex]),
        selectedSort.id !== 'manual'
    )

    const selectTaskAfterCompletion = useCallback(
        (taskId: string) => {
            if (!taskSections) return
            if (params.task !== taskId) return
            const { taskIndex, sectionIndex } = getTaskIndexFromSections(taskSections, taskId)
            if (sectionIndex == null || taskIndex == null) return

            if (taskSections.length === 0 || taskSections[sectionIndex].tasks.length === 0) return
            const previousTask = taskSections[sectionIndex].tasks[taskIndex - 1]
            if (!previousTask) return
            navigateToTask(previousTask.id)
        },
        [taskSections, params.task]
    )

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
                                    <ActionsContainer>
                                        <SortAndFilterSelectors settings={sortAndFilterSettings} />
                                    </ActionsContainer>
                                )}
                                {!section.is_done && !section.is_trash && (
                                    <CreateNewItemInput
                                        placeholder="Create new task"
                                        shortcutName="createTask"
                                        onSubmit={(title) =>
                                            createTask({
                                                title: title,
                                                taskSectionId: section.id,
                                                optimisticId: uuidv4(),
                                            })
                                        }
                                    />
                                )}
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
                                                onMarkTaskDone={selectTaskAfterCompletion}
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
                <TaskDetails task={task} subtask={subtask} />
            ) : (
                <EmptyDetails icon={icons.check} text="You have no tasks" />
            )}
        </>
    )
}

export default TaskSectionView
