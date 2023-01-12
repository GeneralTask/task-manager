import { Ref, forwardRef, useCallback } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { useNavigateToTask, usePreviewMode } from '../../../hooks'
import { useCreateTask, useGetTasks, useReorderTask } from '../../../services/api/tasks.hooks'
import SortAndFilterSelectors from '../../../utils/sortAndFilter/SortAndFilterSelectors'
import { TASK_SORT_AND_FILTER_CONFIG } from '../../../utils/sortAndFilter/tasks.config'
import useSortAndFilterSettings from '../../../utils/sortAndFilter/useSortAndFilterSettings'
import { DropItem, DropType, TTask } from '../../../utils/types'
import { getTaskIndexFromSections } from '../../../utils/utils'
import ReorderDropContainer from '../../atoms/ReorderDropContainer'
import CreateNewItemInput from '../../molecules/CreateNewItemInput'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import EmptyListMessage from './EmptyListMessage'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const TaskSectionViewItems = forwardRef(
    ({ view, visibleItemsCount, scrollRef, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
        const { data: taskSections } = useGetTasks()
        const { task_section_id: sectionId } = view
        const { overviewViewId, overviewItemId } = useParams()
        const { mutate: createTask } = useCreateTask()
        const { mutate: reorderTask } = useReorderTask()
        const location = useLocation()
        const navigateToTask = useNavigateToTask()
        const { isPreviewMode } = usePreviewMode()
        const basePath =
            location.pathname.split('/')[1] === 'daily-overview' && isPreviewMode ? '/daily-overview' : '/overview'

        const sortAndFilterSettings = useSortAndFilterSettings<TTask>(
            TASK_SORT_AND_FILTER_CONFIG,
            view.task_section_id,
            '_overview'
        )
        const handleReorderTask = useCallback(
            (item: DropItem, dropIndex: number) => {
                if (!view.task_section_id) return
                reorderTask(
                    {
                        id: item.id,
                        orderingId: dropIndex,
                        dropSectionId: view.task_section_id,
                        dragSectionId: item.sectionId,
                    },
                    item.task?.optimisticId
                )
            },
            [view.task_section_id]
        )

        const selectTaskAfterCompletion = (taskId: string) => {
            if (!taskSections) return
            if (overviewItemId !== taskId) return
            const { taskIndex, sectionIndex } = getTaskIndexFromSections(taskSections, taskId)
            if (sectionIndex == null || taskIndex == null) return

            if (taskSections.length === 0 || taskSections[sectionIndex].tasks.length === 0) return
            const previousTask = taskSections[sectionIndex].tasks[taskIndex - 1]
            if (!previousTask) return
            navigateToTask(previousTask.id)
        }

        return (
            <>
                {!hideHeader && (
                    <ViewHeader ref={ref}>
                        <ViewName>{view.name}</ViewName>
                    </ViewHeader>
                )}
                {view.total_view_items !== 0 && <SortAndFilterSelectors settings={sortAndFilterSettings} />}
                {sectionId && (
                    <CreateNewItemInput
                        placeholder="Create new task"
                        onSubmit={(title) =>
                            createTask({
                                title: title,
                                taskSectionId: sectionId,
                                optimisticId: uuidv4(),
                            })
                        }
                    />
                )}
                {view.view_items.length > 0 ? (
                    view.view_items.slice(0, visibleItemsCount).map((item, index) => (
                        <ReorderDropContainer
                            key={item.id}
                            index={index}
                            acceptDropType={DropType.TASK}
                            onReorder={handleReorderTask}
                            disabled={sortAndFilterSettings.selectedSort.id !== 'manual'}
                        >
                            <Task
                                task={item as TTask}
                                dragDisabled={item.is_done}
                                index={index}
                                sectionId={sectionId}
                                sectionScrollingRef={scrollRef}
                                isSelected={overviewViewId === view.id && overviewItemId === item.id}
                                link={`${basePath}/${view.id}/${item.id}`}
                                onMarkTaskDone={() => selectTaskAfterCompletion(item.id)}
                            />
                        </ReorderDropContainer>
                    ))
                ) : (
                    <ReorderDropContainer
                        index={0}
                        acceptDropType={DropType.TASK}
                        onReorder={handleReorderTask}
                        indicatorType="WHOLE"
                        disabled={sortAndFilterSettings.selectedSort.id !== 'manual'}
                    >
                        {isPreviewMode ? (
                            <EmptyListMessage list={view} />
                        ) : (
                            <EmptyViewItem
                                header="You've completed all your tasks!"
                                body="Create new tasks to see them here."
                            />
                        )}
                    </ReorderDropContainer>
                )}
            </>
        )
    }
)

export default TaskSectionViewItems
