import { useParams } from 'react-router-dom'
import { TTask } from '../../../utils/types'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const ExternalViewItems = ({ view, visibleItemsCount, scrollRef }: ViewItemsProps) => {
    const { overviewViewId, overviewItemId } = useParams()

    const getEmptyViewItem = () => {
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
            <ViewHeader>
                <ViewName>{view.name}</ViewName>
            </ViewHeader>
            {view.view_items.length === 0 && view.is_linked && getEmptyViewItem()}
            {view.view_items.slice(0, visibleItemsCount).map((item) => (
                <Task
                    key={item.id}
                    task={item as TTask}
                    dragDisabled={true}
                    sectionScrollingRef={scrollRef}
                    isSelected={overviewViewId === view.id && overviewItemId === item.id}
                    link={`/overview/${view.id}/${item.id}`}
                />
            ))}
        </>
    )
}

export default ExternalViewItems
