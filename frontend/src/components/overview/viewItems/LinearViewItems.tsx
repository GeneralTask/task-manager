import { Ref, forwardRef, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { usePreviewMode } from '../../../hooks'
import useGetActiveTasks from '../../../hooks/useGetActiveTasks'
import SortAndFilterSelectors from '../../../utils/sortAndFilter/SortAndFilterSelectors'
import { LINEAR_SORT_AND_FILTER_CONFIG } from '../../../utils/sortAndFilter/linear.config'
import sortAndFilterItems from '../../../utils/sortAndFilter/sortAndFilterItems'
import useSortAndFilterSettings from '../../../utils/sortAndFilter/useSortAndFilterSettings'
import { DropType, TTaskV4 } from '../../../utils/types'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import EmptyListMessage from './EmptyListMessage'
import { ViewItemsProps } from './viewItems.types'

const LinearViewItems = forwardRef(
    ({ view, visibleItemsCount, scrollRef, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
        const { isPreviewMode } = usePreviewMode()
        const { overviewViewId, overviewItemId } = useParams()
        const { data: activeTasks } = useGetActiveTasks()

        const sortAndFilterSettings = useSortAndFilterSettings<TTaskV4>(
            LINEAR_SORT_AND_FILTER_CONFIG,
            undefined,
            '_overview'
        )

        const linearViewItems = useMemo(() => {
            const filteredLinearTasks = activeTasks?.filter((task) => view.view_item_ids.includes(task.id)) || []
            if (!isPreviewMode) return filteredLinearTasks
            return sortAndFilterItems<TTaskV4>({
                items: filteredLinearTasks,
                filter: sortAndFilterSettings.selectedFilter,
                tieBreakerField: LINEAR_SORT_AND_FILTER_CONFIG.tieBreakerField,
            })
        }, [activeTasks, sortAndFilterSettings.selectedFilter, isPreviewMode])

        return (
            <>
                {!hideHeader && (
                    <ViewHeader ref={ref}>
                        <ViewName>{view.name}</ViewName>
                    </ViewHeader>
                )}
                {isPreviewMode && <SortAndFilterSelectors settings={sortAndFilterSettings} />}
                {linearViewItems.length === 0 && view.is_linked && <EmptyListMessage list={view} />}
                {linearViewItems.slice(0, visibleItemsCount).map((item) => (
                    <Task
                        key={item.id}
                        dropType={DropType.NON_REORDERABLE_TASK}
                        task={item as TTaskV4}
                        sectionScrollingRef={scrollRef}
                        isSelected={overviewViewId === view.id && overviewItemId === item.id}
                        link={`/overview/${view.id}/${item.id}`}
                    />
                ))}
            </>
        )
    }
)

export default LinearViewItems
