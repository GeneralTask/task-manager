import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import { usePreviewMode } from '../../../hooks'
import { TTask } from '../../../utils/types'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import EmptyListMessage from './EmptyListMessage'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const DueTodayViewItems = forwardRef(
    ({ view, visibleItemsCount, scrollRef, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
        const { overviewViewId, overviewItemId } = useParams()
        const { isPreviewMode } = usePreviewMode()
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
                                task={item as TTask}
                                dragDisabled={true}
                                index={index}
                                isSelected={overviewViewId === view.id && overviewItemId === item.id}
                                sectionScrollingRef={scrollRef}
                                link={`/overview/${view.id}/${item.id}`}
                            />
                        ))
                ) : isPreviewMode ? (
                    <EmptyListMessage list={view} />
                ) : (
                    <EmptyViewItem
                        header="You have no more tasks due today."
                        body="When you have tasks left which are due today, they will appear here."
                    />
                )}
            </>
        )
    }
)

export default DueTodayViewItems
