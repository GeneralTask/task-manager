import { Ref, forwardRef, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useReorderTask } from '../../../services/api/tasks.hooks'
import SortAndFilterSelectors from '../../../utils/sortAndFilter/SortAndFilterSelectors'
import sortAndFilterItems from '../../../utils/sortAndFilter/sortAndFilterItems'
import { TASK_SORT_AND_FILTER_CONFIG } from '../../../utils/sortAndFilter/tasks.config'
import useSortAndFilterSettings from '../../../utils/sortAndFilter/useSortAndFilterSettings'
import { DropItem, DropType, TTask } from '../../../utils/types'
import ReorderDropContainer from '../../atoms/ReorderDropContainer'
import CreateNewTask from '../../molecules/CreateNewTask'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const TaskSectionViewItems = forwardRef(
    ({ view, visibleItemsCount, scrollRef }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
        const { task_section_id: sectionId } = view
        const { overviewViewId, overviewItemId } = useParams()
        const { mutate: reorderTask } = useReorderTask()

        const sortAndFilterSettings = useSortAndFilterSettings<TTask>(
            TASK_SORT_AND_FILTER_CONFIG,
            view.task_section_id,
            '_main'
        )
        const {
            selectedSort,
            selectedSortDirection,
            selectedFilter,
            isLoading: areSettingsLoading,
        } = sortAndFilterSettings

        const sortedTasks = useMemo(() => {
            if (areSettingsLoading) return []
            return sortAndFilterItems({
                items: view.view_items,
                sort: selectedSort,
                sortDirection: selectedSortDirection,
                tieBreakerField: TASK_SORT_AND_FILTER_CONFIG.tieBreakerField,
            })
        }, [view, selectedSort, selectedSortDirection, selectedFilter])

        const handleReorderTask = useCallback(
            (item: DropItem, dropIndex: number) => {
                if (!view.task_section_id) return
                reorderTask({
                    taskId: item.id,
                    orderingId: dropIndex,
                    dropSectionId: view.task_section_id,
                    dragSectionId: item.sectionId,
                })
            },
            [view.task_section_id]
        )

        return (
            <>
                <ViewHeader ref={ref}>
                    <ViewName>{view.name}</ViewName>
                </ViewHeader>
                {view.view_items.length > 0 && <SortAndFilterSelectors settings={sortAndFilterSettings} />}
                {sectionId && <CreateNewTask disableTooltip sectionId={sectionId} />}
                {sortedTasks.length > 0 ? (
                    sortedTasks.slice(0, visibleItemsCount).map((item, index) => (
                        <ReorderDropContainer
                            key={item.id}
                            index={index}
                            acceptDropType={DropType.TASK}
                            onReorder={handleReorderTask}
                        >
                            <Task
                                task={item as TTask}
                                dragDisabled={sortAndFilterSettings.selectedSort.id !== 'manual'}
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
                    >
                        <EmptyViewItem
                            header="You've completed all your tasks!"
                            body="Create new tasks to see them here."
                        />
                    </ReorderDropContainer>
                )}
            </>
        )
    }
)

export default TaskSectionViewItems
