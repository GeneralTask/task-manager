import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import useItemSelectionController from '../../hooks/useItemSelectionController'
import { useFetchExternalTasks, useGetTasks, useReorderTask } from '../../services/api/tasks.hooks'
import { Colors } from '../../styles'
import { icons } from '../../styles/images'
import { DropItem, DropType } from '../../utils/types'
import Loading from '../atoms/Loading'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import CreateNewTask from '../molecules/CreateNewTask'
import { Header } from '../molecules/Header'
import Task from '../molecules/Task'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const TaskFolderContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-right: auto;
    flex-shrink: 0;
    position: relative;
`
const TaskFolderViewContainer = styled.div`
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

const TaskFolderView = () => {
    const folderScrollingRef = useRef<HTMLDivElement | null>(null)
    const folderViewRef = useRef<HTMLDivElement>(null)

    const { data: taskFolders, isLoading: isLoadingTasks } = useGetTasks()
    const { mutate: reorderTask } = useReorderTask()
    useFetchExternalTasks()

    const navigate = useNavigate()
    const params = useParams()

    const { folder, task } = useMemo(() => {
        const folder = taskFolders?.find(({ id }) => id === params.folder)
        const task = folder?.tasks.find(({ id }) => id === params.task)
        return { folder, task }
    }, [taskFolders, params.task, params.folder])

    const selectTask = useCallback(
        (itemId: string) => {
            if (folder) navigate(`/tasks/${folder.id}/${itemId}`)
        },
        [folder]
    )

    const handleReorderTask = useCallback(
        (item: DropItem, dropIndex: number) => {
            if (!folder) return
            reorderTask({
                taskId: item.id,
                orderingId: dropIndex,
                dropFolderId: folder.id,
            })
        },
        [folder]
    )

    // deal with invalid routes
    useEffect(() => {
        if (taskFolders && taskFolders.length > 0 && (!folder || !task)) {
            const firstFolderId = taskFolders[0].id
            if (!folder) {
                navigate(`/tasks/${firstFolderId}/`)
            } else if (!task && folder.tasks.length > 0) {
                navigate(`/tasks/${folder.id}/${folder.tasks[0].id}`)
            }
        }
    }, [taskFolders, params.folder, params.task])

    useItemSelectionController(folder?.tasks ?? [], selectTask)

    return (
        <>
            <TaskFolderContainer>
                <ScrollableListTemplate ref={folderScrollingRef}>
                    <TaskFolderViewContainer>
                        {isLoadingTasks || !folder ? (
                            <Loading />
                        ) : (
                            <>
                                <Header name={folder.name} taskFolderId={folder.id} />
                                {!folder.is_done && <CreateNewTask folderId={folder.id} />}
                                <TasksContainer ref={folderViewRef} data-testid="task-list-container">
                                    {folder.tasks.map((task, index) => (
                                        <ReorderDropContainer
                                            key={task.id}
                                            index={index}
                                            acceptDropType={DropType.TASK}
                                            onReorder={handleReorderTask}
                                        >
                                            <Task
                                                task={task}
                                                dragDisabled={folder.is_done}
                                                index={index}
                                                folderId={folder.id}
                                                folderScrollingRef={folderScrollingRef}
                                                isSelected={task.id === params.task}
                                                link={`/tasks/${params.folder}/${task.id}`}
                                            />
                                        </ReorderDropContainer>
                                    ))}
                                </TasksContainer>
                                <ReorderDropContainer
                                    index={folder.tasks.length + 1}
                                    acceptDropType={DropType.TASK}
                                    onReorder={handleReorderTask}
                                    indicatorType="TOP_ONLY"
                                >
                                    <BottomDropArea />
                                </ReorderDropContainer>
                            </>
                        )}
                    </TaskFolderViewContainer>
                </ScrollableListTemplate>
            </TaskFolderContainer>
            {task && folder ? (
                <TaskDetails task={task} link={`/tasks/${params.folder}/${task.id}`} />
            ) : (
                <EmptyDetails icon={icons.check} text="You have no tasks" />
            )}
        </>
    )
}

export default TaskFolderView
