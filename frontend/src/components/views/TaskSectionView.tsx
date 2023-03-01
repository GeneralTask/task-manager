import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import { DONE_FOLDER_ID, TRASH_FOLDER_ID } from '../../constants'
import { useKeyboardShortcut } from '../../hooks'
import { useNavigateToTask } from '../../hooks'
import useItemSelectionController from '../../hooks/useItemSelectionController'
import { useGetFolders } from '../../services/api/folders.hooks'
import Log from '../../services/api/log'
import { useCreateTask, useFetchExternalTasks, useReorderTask } from '../../services/api/tasks.hooks'
import { useGetTasksV4 } from '../../services/api/tasks.hooks'
import { Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import SortAndFilterSelectors from '../../utils/sortAndFilter/SortAndFilterSelectors'
import sortAndFilterItems from '../../utils/sortAndFilter/sortAndFilterItems'
import { TASK_SORT_AND_FILTER_CONFIG } from '../../utils/sortAndFilter/tasks.config'
import useSortAndFilterSettings from '../../utils/sortAndFilter/useSortAndFilterSettings'
import { DropItem, DropType, TTaskV4 } from '../../utils/types'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import Spinner from '../atoms/Spinner'
import { useCalendarContext } from '../calendar/CalendarContext'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import CreateNewItemInput from '../molecules/CreateNewItemInput'
import { Header } from '../molecules/Header'
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

    const { calendarType } = useCalendarContext()
    const { data: allTasks, isLoading: isLoadingTasks } = useGetTasksV4()
    const { data: folders } = useGetFolders()
    const { mutate: createTask } = useCreateTask()
    const { mutate: reorderTask } = useReorderTask()
    useFetchExternalTasks()

    const navigate = useNavigate()
    const params = useParams()
    const navigateToTask = useNavigateToTask()

    const folder = useMemo(() => folders?.find(({ id }) => id === params.section), [folders, params.section])
    const folderTasks = useMemo(() => {
        if (!folder) return []
        if (folder.id === DONE_FOLDER_ID) {
            return allTasks?.filter((t) => t.is_done && !t.is_deleted && !t.id_parent) || []
        } else if (folder.id === TRASH_FOLDER_ID) {
            return allTasks?.filter((t) => t.is_deleted) || []
        }
        return allTasks?.filter((t) => t.id_folder === folder.id && !t.is_done && !t.is_deleted) || []
    }, [allTasks, folder])

    const sortAndFilterSettings = useSortAndFilterSettings<TTaskV4>(TASK_SORT_AND_FILTER_CONFIG, folder?.id, '_main')
    const { selectedSort, selectedSortDirection, isLoading: areSettingsLoading } = sortAndFilterSettings
    const sortedTasks = useMemo(() => {
        if (folder && (folder.is_done || folder.is_trash)) return folderTasks
        if (!folder || areSettingsLoading) return []

        return sortAndFilterItems<TTaskV4>({
            items: folderTasks,
            sort: selectedSort,
            sortDirection: selectedSortDirection,
            tieBreakerField: TASK_SORT_AND_FILTER_CONFIG.tieBreakerField,
        })
    }, [folder, folderTasks, selectedSort, selectedSortDirection, areSettingsLoading])

    const task = useMemo(() => {
        const subtask = allTasks?.find(({ id }) => id === params.subtaskId)
        const task = allTasks?.find(({ id }) => id === params.task)
        return subtask || task
    }, [allTasks, params.task, params.subtaskId])

    const [taskIndex, setTaskIndex] = useState(0)

    useEffect(() => {
        if (task) {
            const index = sortedTasks.findIndex(({ id }) => id === task.id)
            setTaskIndex(index === -1 ? 0 : index)
        }
    }, [params.task, params.section, sortedTasks, task])

    const selectTask = useCallback(
        (task: TTaskV4) => {
            setShouldScrollToTask(true)
            if (folder) {
                navigate(`/tasks/${folder.id}/${task.id}`, { replace: true })
                Log(`task_select_${task.id}`)
            }
        },
        [folder]
    )
    const handleReorderTask = useCallback(
        (item: DropItem, dropIndex: number) => {
            if (!folder) return
            reorderTask(
                {
                    id: item.id,
                    orderingId: dropIndex,
                    dropSectionId: folder.id,
                },
                item.task?.optimisticId
            )
        },
        [folder]
    )

    // deal with invalid routes
    useEffect(() => {
        if (folders && folders.length > 0 && (!folder || !task)) {
            const firstFolderId = folders[0].id
            if (!folder) {
                navigate(`/tasks/${firstFolderId}/`, { replace: true })
            } else if (!task && sortedTasks.length > taskIndex) {
                navigate(`/tasks/${folder.id}/${sortedTasks[taskIndex].id}`, { replace: true })
            } else if (!task && sortedTasks.length === taskIndex && taskIndex > 0) {
                navigate(`/tasks/${folder.id}/${sortedTasks[taskIndex - 1].id}`, { replace: true })
            } else if (!task && sortedTasks.length > 0) {
                navigate(`/tasks/${folder.id}/${sortedTasks[0].id}`, { replace: true })
            }
        }
    }, [folders, params.section, params.task, sortedTasks])

    useItemSelectionController(sortedTasks, selectTask)

    useKeyboardShortcut(
        'moveTaskDown',
        useCallback(() => {
            if (!task || !folder || taskIndex === sortedTasks.length - 1) return
            reorderTask({
                id: task.id,
                orderingId: task.id_ordering + 2,
                dropSectionId: folder.id,
            })
        }, [task, folder, sortedTasks, taskIndex, sortedTasks]),
        selectedSort.id !== 'manual'
    )
    useKeyboardShortcut(
        'moveTaskUp',
        useCallback(() => {
            if (!task || !folder || taskIndex === 0) return
            reorderTask({
                id: task.id,
                orderingId: task.id_ordering - 1,
                dropSectionId: folder.id,
            })
        }, [task, folder, sortedTasks, taskIndex]),
        selectedSort.id !== 'manual'
    )

    const selectTaskAfterCompletion = useCallback(
        (taskId: string) => {
            if (!folders) return
            if (params.task !== taskId) return
            const folderIndex = folders.findIndex(({ id }) => id === params.section)
            const taskIndex = sortedTasks.findIndex(({ id }) => id === taskId)
            if (folderIndex == null || taskIndex == null) return

            if (folders.length === 0 || sortedTasks.length === 0) return
            const previousTask = sortedTasks[taskIndex - 1]
            if (!previousTask) return
            navigateToTask({ taskId: previousTask.id })
        },
        [folders, params.task]
    )

    return (
        <>
            <TaskSectionContainer>
                <ScrollableListTemplate ref={sectionScrollingRef}>
                    <TaskSectionViewContainer>
                        {isLoadingTasks || !folder || (areSettingsLoading && !folder.is_done && !folder.is_trash) ? (
                            <Spinner />
                        ) : (
                            <>
                                <Header folderName={folder.name} folderId={folder.id} />
                                {!folder.is_done && !folder.is_trash && (
                                    <ActionsContainer>
                                        <SortAndFilterSelectors settings={sortAndFilterSettings} />
                                    </ActionsContainer>
                                )}
                                {!folder.is_done && !folder.is_trash && (
                                    <CreateNewItemInput
                                        placeholder="Create new task"
                                        shortcutName="createTask"
                                        onSubmit={(title) =>
                                            createTask({
                                                title: title,
                                                id_folder: folder.id,
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
                                                folder.is_done ||
                                                folder.is_trash
                                            }
                                        >
                                            <Task
                                                task={task}
                                                index={index}
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
                                        folder.is_done ||
                                        folder.is_trash
                                    }
                                >
                                    <BottomDropArea />
                                </ReorderDropContainer>
                            </>
                        )}
                    </TaskSectionViewContainer>
                </ScrollableListTemplate>
            </TaskSectionContainer>
            {calendarType === 'day' && (
                <>
                    {task && folder ? (
                        <TaskDetails task={task} />
                    ) : (
                        <EmptyDetails icon={icons.check} text="You have no tasks" />
                    )}
                </>
            )}
        </>
    )
}

export default TaskSectionView
