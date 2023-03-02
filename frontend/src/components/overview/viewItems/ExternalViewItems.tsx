import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import useGetActiveTasks from '../../../hooks/useGetActiveTasks'
import { DropType, TTaskV4 } from '../../../utils/types'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import EmptyListMessage from './EmptyListMessage'
import { ViewItemsProps } from './viewItems.types'

const ExternalViewItems = forwardRef(
    ({ view, visibleItemsCount, scrollRef, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
        const { overviewViewId, overviewItemId } = useParams()
        const { data: activeTasks } = useGetActiveTasks()

        const externalViewItems = activeTasks?.filter((task) => view.view_item_ids.includes(task.id)) || []
        return (
            <>
                {!hideHeader && (
                    <ViewHeader ref={ref}>
                        <ViewName>{view.name}</ViewName>
                    </ViewHeader>
                )}
                {externalViewItems.length === 0 && view.is_linked && <EmptyListMessage list={view} />}
                {externalViewItems.slice(0, visibleItemsCount).map((item) => (
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
