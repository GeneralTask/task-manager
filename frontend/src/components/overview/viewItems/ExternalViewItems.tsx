import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import { DropType, TTaskV4 } from '../../../utils/types'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import EmptyListMessage from './EmptyListMessage'
import { ViewItemsProps } from './viewItems.types'

const ExternalViewItems = forwardRef(
    ({ view, visibleItemsCount, scrollRef, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
        const { overviewViewId, overviewItemId } = useParams()

        return (
            <>
                {!hideHeader && (
                    <ViewHeader ref={ref}>
                        <ViewName>{view.name}</ViewName>
                    </ViewHeader>
                )}
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

export default ExternalViewItems
