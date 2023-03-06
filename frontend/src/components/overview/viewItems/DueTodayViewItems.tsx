import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import useGetVisibleItemCount, { PAGE_SIZE } from '../../../hooks/useGetVisibleItemCount'
import { TTaskV4 } from '../../../utils/types'
import Task from '../../molecules/Task'
import { PaginateTextButton, ViewHeader, ViewName } from '../styles'
import useOverviewItems from '../useOverviewItems'
import EmptyListMessage from './EmptyListMessage'
import { ViewItemsProps } from './viewItems.types'

const DueTodayViewItems = forwardRef(({ view, scrollRef, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
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
            {items.length > 0 ? (
                <>
                    {items.slice(0, visibleItemsCount).map((item, index) => (
                        <Task
                            key={item.id}
                            task={item as TTaskV4}
                            dragDisabled={true}
                            index={index}
                            isSelected={overviewViewId === view.id && overviewItemId === item.id}
                            sectionScrollingRef={scrollRef}
                            link={`/overview/${view.id}/${item.id}`}
                        />
                    ))}
                    {visibleItemsCount < items.length && (
                        <PaginateTextButton onClick={() => setVisibleItemsCount(visibleItemsCount + nextPageLength)}>
                            View more ({nextPageLength})
                        </PaginateTextButton>
                    )}
                </>
            ) : (
                <EmptyListMessage list={view} />
            )}
        </>
    )
})

export default DueTodayViewItems
