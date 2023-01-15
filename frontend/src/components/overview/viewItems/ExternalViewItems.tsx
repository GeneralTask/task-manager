import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import { usePreviewMode } from '../../../hooks'
import { DropType, TTask } from '../../../utils/types'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import EmptyListMessage from './EmptyListMessage'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const ExternalViewItems = forwardRef(
    ({ view, visibleItemsCount, scrollRef, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
        const { overviewViewId, overviewItemId } = useParams()
        const { isPreviewMode } = usePreviewMode()

        const getEmptyViewItem = () => {
            if (isPreviewMode) return <EmptyListMessage list={view} />
            if (view.type === 'slack') {
                return (
                    <EmptyViewItem
                        header="You have no more slack messages!"
                        body="When you create a task from a slack message, it will appear here."
                    />
                )
            } else if (view.type === 'linear') {
                return (
                    <EmptyViewItem
                        header="You have no more linear tasks!"
                        body="When new linear tasks get assigned to you, they will appear here."
                    />
                )
            }
        }

        return (
            <>
                {!hideHeader && (
                    <ViewHeader ref={ref}>
                        <ViewName>{view.name}</ViewName>
                    </ViewHeader>
                )}
                {view.view_items.length === 0 && view.is_linked && getEmptyViewItem()}
                {view.view_items.slice(0, visibleItemsCount).map((item) => (
                    <Task
                        key={item.id}
                        dropType={DropType.NON_REORDERABLE_TASK}
                        task={item as TTask}
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
