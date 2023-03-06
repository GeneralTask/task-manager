import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import { usePreviewMode } from '../../../hooks'
import SortAndFilterSelectors from '../../../utils/sortAndFilter/SortAndFilterSelectors'
import { LINEAR_SORT_AND_FILTER_CONFIG } from '../../../utils/sortAndFilter/linear.config'
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

        const sortAndFilterSettings = useSortAndFilterSettings<TTaskV4>(
            LINEAR_SORT_AND_FILTER_CONFIG,
            undefined,
            '_overview'
        )
        console.log(view.view_items)

        return (
            <>
                {!hideHeader && (
                    <ViewHeader ref={ref}>
                        <ViewName>{view.name}</ViewName>
                    </ViewHeader>
                )}
                {isPreviewMode && <SortAndFilterSelectors settings={sortAndFilterSettings} />}
                {view.view_items.length === 0 && view.is_linked && <EmptyListMessage list={view} />}
                {view.view_items.slice(0, visibleItemsCount).map((item) => (
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
