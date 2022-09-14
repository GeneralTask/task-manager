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
    }, [taskSections, params.section, params.task])

    useItemSelectionController(section?.tasks ?? [], selectTask)

    return (
        <>
            <TaskSectionContainer>
                <ScrollableListTemplate ref={sectionScrollingRef}>
                    <TaskSectionViewContainer>
                        {isLoadingTasks || !section ? (
                            <Loading />
                        ) : (
                            <>
                                <SectionHeader sectionName={section.name} taskSectionId={section.id} />
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
