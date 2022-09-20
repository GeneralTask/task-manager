import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import { TTask } from '../../../utils/types'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const MeetingPreparationViewItems = forwardRef(({ view }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
    const { overviewViewId, overviewItemId } = useParams()
    return (
        <>
            <ViewHeader ref={ref}>
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
                    header="You have no more meeting preparation tasks."
                    body="When you have an upcoming calendar event, they will appear here."
                />
            )}
        </>
    )
})

export default MeetingPreparationViewItems
