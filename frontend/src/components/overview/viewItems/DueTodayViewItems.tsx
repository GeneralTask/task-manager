import { useParams } from 'react-router-dom'
import { TTask } from '../../../utils/types'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const DueTodayViewItems = ({ view }: ViewItemsProps) => {
    const { overviewViewId, overviewItemId } = useParams()
    return (
        <>
            <ViewHeader>
                <ViewName>{view.name}</ViewName>
            </ViewHeader>
            {view.view_items.length > 0 ? (
                view.view_items.map((item, index) => (
                    <Task
                        key={item.id}
                        task={item as TTask}
                        dragDisabled={true}
                        index={index}
                        isSelected={overviewViewId === view.id && overviewItemId === item.id}
                        link={`/overview/${view.id}/${item.id}`}
                    />
                ))
            ) : (
                <EmptyViewItem
                    header="You have no more tasks due today."
                    body="When you have tasks left which are due today, they will appear here."
                />
            )}
        </>
    )
}

export default DueTodayViewItems
