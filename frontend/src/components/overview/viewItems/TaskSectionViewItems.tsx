import { Ref, forwardRef, useCallback } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import useGetVisibleItemCount, { PAGE_SIZE } from '../../../hooks/useGetVisibleItemCount'
import { useGetOverviewViews } from '../../../services/api/overview.hooks'
import { useCreateTask, useReorderTask } from '../../../services/api/tasks.hooks'
import SortAndFilterSelectors from '../../../utils/sortAndFilter/SortAndFilterSelectors'
import { SortAndFilterSettings } from '../../../utils/sortAndFilter/types'
import { DropItem, DropType, TTaskV4 } from '../../../utils/types'
import ReorderDropContainer from '../../atoms/ReorderDropContainer'
import CreateNewItemInput from '../../molecules/CreateNewItemInput'
import Task from '../../molecules/Task'
import { PaginateTextButton, ViewHeader, ViewName } from '../styles'
import useOverviewItems from '../useOverviewItems'
import EmptyListMessage from './EmptyListMessage'
import { ViewItemsProps } from './viewItems.types'

const TaskSectionViewItems = forwardRef(({ view, scrollRef, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
    const { data: lists } = useGetOverviewViews()
    const { overviewViewId, overviewItemId } = useParams()
    const { mutate: createTask } = useCreateTask()
    const { mutate: reorderTask } = useReorderTask()
    const navigate = useNavigate()
    const location = useLocation()

    const { sortedAndFilteredItems, sortAndFilterSettings } = useOverviewItems(view)
    const items = sortedAndFilteredItems as TTaskV4[]
    const settings = sortAndFilterSettings as SortAndFilterSettings<TTaskV4>

    const [visibleItemsCount, setVisibleItemsCount] = useGetVisibleItemCount(view, items.length)
    const nextPageLength = Math.min(items.length - visibleItemsCount, PAGE_SIZE)

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

    const onCreateNewTaskSubmit = (title: string) => {
        if (!view.task_section_id) return
        const optimisticId = uuidv4()
        createTask({
            title: title,
            id_folder: view.task_section_id,
            optimisticId: optimisticId,
        })
        const allListsEmpty = lists?.every((list) => list.view_item_ids.length === 0)
        if (allListsEmpty && location.pathname.includes('overview')) {
            navigate(`/overview/${view.id}/${optimisticId}/`)
        }
    }

    return (
        <>
            {!hideHeader && (
                <ViewHeader ref={ref}>
                    <ViewName>{view.name}</ViewName>
                </ViewHeader>
            )}
            {view.view_item_ids.length !== 0 && <SortAndFilterSelectors settings={settings} />}
            {view.task_section_id && (
                <CreateNewItemInput placeholder="Create new task" onSubmit={onCreateNewTaskSubmit} />
            )}
            {items.length > 0 ? (
                <>
                    {items.slice(0, visibleItemsCount).map((item, index) => (
                        <ReorderDropContainer
                            key={item.id}
                            index={index}
                            acceptDropType={DropType.TASK}
                            onReorder={handleReorderTask}
                            disabled={settings.selectedSort.id !== 'manual'}
                        >
                            <Task
                                task={item}
                                dragDisabled={item.is_done}
                                index={index}
                                sectionScrollingRef={scrollRef}
                                isSelected={overviewViewId === view.id && overviewItemId === item.id}
                                link={`/overview/${view.id}/${item.id}`}
                            />
                        </ReorderDropContainer>
                    ))}
                    {visibleItemsCount < items.length && (
                        <PaginateTextButton onClick={() => setVisibleItemsCount(visibleItemsCount + nextPageLength)}>
                            View more ({nextPageLength})
                        </PaginateTextButton>
                    )}
                </>
            ) : (
                <ReorderDropContainer
                    index={0}
                    acceptDropType={DropType.TASK}
                    onReorder={handleReorderTask}
                    indicatorType="WHOLE"
                    disabled={settings.selectedSort.id !== 'manual'}
                >
                    <EmptyListMessage list={view} />
                </ReorderDropContainer>
            )}
        </>
    )
})

export default TaskSectionViewItems
