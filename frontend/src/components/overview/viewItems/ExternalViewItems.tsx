import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import useGetVisibleItemCount, { PAGE_SIZE } from '../../../hooks/useGetVisibleItemCount'
import { DropType, TTaskV4 } from '../../../utils/types'
import Task from '../../molecules/Task'
import { PaginateTextButton, ViewHeader, ViewName } from '../styles'
import useOverviewItems from '../useOverviewItems'
import EmptyListMessage from './EmptyListMessage'
import { ViewItemsProps } from './viewItems.types'

const ExternalViewItems = forwardRef(({ view, scrollRef, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
    const { overviewViewId, overviewItemId } = useParams()

    const { sortedAndFilteredItems } = useOverviewItems(view)
    const items = sortedAndFilteredItems as TTaskV4[]

    const [visibleItemsCount, setVisibleItemsCount] = useGetVisibleItemCount(view, items.length)
    const nextPageLength = Math.min(items.length - visibleItemsCount, PAGE_SIZE)

    return (
        <>
            {!hideHeader && (
                <ViewHeader ref={ref}>
                    <ViewName>{view.name}</ViewName>
                </ViewHeader>
            )}
            {items.length === 0 && view.is_linked && <EmptyListMessage list={view} />}
            {items.slice(0, visibleItemsCount).map((item) => (
                <Task
                    key={item.id}
                    dropType={DropType.NON_REORDERABLE_TASK}
                    task={item}
                    sectionScrollingRef={scrollRef}
                    isSelected={overviewViewId === view.id && overviewItemId === item.id}
                    link={`/overview/${view.id}/${item.id}`}
                />
            ))}
            {visibleItemsCount < items.length && (
                <PaginateTextButton onClick={() => setVisibleItemsCount(visibleItemsCount + nextPageLength)}>
                    View more ({nextPageLength})
                </PaginateTextButton>
            )}
        </>
    )
})

export default ExternalViewItems
