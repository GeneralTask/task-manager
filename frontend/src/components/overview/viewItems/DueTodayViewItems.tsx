import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import { TTaskV4 } from '../../../utils/types'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import EmptyListMessage from './EmptyListMessage'
import { ViewItemsProps } from './viewItems.types'

const DueTodayViewItems = forwardRef(
    ({ view, visibleItemsCount, scrollRef, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
        const { overviewViewId, overviewItemId } = useParams()
        return (
            <>
                {!hideHeader && (
                    <ViewHeader ref={ref}>
                        <ViewName>{view.name}</ViewName>
                    </ViewHeader>
                )}
                {view.view_items.length > 0 ? (
                    view.view_items
                        .slice(0, visibleItemsCount)
                        .map((item, index) => (
                            <Task
                                key={item.id}
                                task={item as TTaskV4}
                                dragDisabled={true}
                                index={index}
                                isSelected={overviewViewId === view.id && overviewItemId === item.id}
                                sectionScrollingRef={scrollRef}
                                link={`/overview/${view.id}/${item.id}`}
                            />
                        ))
                ) : (
                    <EmptyListMessage list={view} />
                )}
            </>
        )
    }
)

export default DueTodayViewItems
