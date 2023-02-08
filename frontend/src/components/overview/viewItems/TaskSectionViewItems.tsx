import { Ref, forwardRef, useCallback } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { useCreateTask, useReorderTask } from '../../../services/api/tasks.hooks'
import SortAndFilterSelectors from '../../../utils/sortAndFilter/SortAndFilterSelectors'
import { TASK_SORT_AND_FILTER_CONFIG } from '../../../utils/sortAndFilter/tasks.config'
import useSortAndFilterSettings from '../../../utils/sortAndFilter/useSortAndFilterSettings'
import { DropItem, DropType, TTask } from '../../../utils/types'
import ReorderDropContainer from '../../atoms/ReorderDropContainer'
import CreateNewItemInput from '../../molecules/CreateNewItemInput'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import useOverviewLists from '../useOverviewLists'
import EmptyListMessage from './EmptyListMessage'
import { ViewItemsProps } from './viewItems.types'

const TaskSectionViewItems = forwardRef(
    ({ view, visibleItemsCount, scrollRef, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
        const { lists } = useOverviewLists()
        const { task_section_id: sectionId } = view
        const { overviewViewId, overviewItemId } = useParams()
        const { mutate: createTask } = useCreateTask()
        const { mutate: reorderTask } = useReorderTask()
        const navigate = useNavigate()
        const location = useLocation()

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
                        onSubmit={(title) => {
                            const optimisticId = uuidv4()
                            createTask({
                                title: title,
                                taskSectionId: sectionId,
                                optimisticId: optimisticId,
                            })
                            const allListsEmpty = lists?.every((list) => list.view_items.length === 0)
                            //check if on overview page
                            if (allListsEmpty && location.pathname.includes('overview')) {
                                navigate(`/overview/${view.id}/${optimisticId}/`)
                            }
                        }}
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
                                link={`/overview/${view.id}/${item.id}`}
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
                        <EmptyListMessage list={view} />
                    </ReorderDropContainer>
                )}
            </>
        )
    }
)

export default TaskSectionViewItems
