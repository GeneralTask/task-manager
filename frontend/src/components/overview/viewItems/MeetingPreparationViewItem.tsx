import React from 'react'
import { useParams } from 'react-router-dom'
import { TTask } from '../../../utils/types'
import Task from '../../molecules/Task'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const MeetingPreparationViewItem = ({ view }: ViewItemsProps) => {
    const { overviewViewId, overviewItemId } = useParams()
    return (
        <>
            {view.view_items.length > 0 ? (
                view.view_items.map((item, index) => (
                    <Task
                        key={item.id}
                        task={item as TTask}
                        dragDisabled={true}
                        index={index}
                        isSelected={overviewViewId === view.id && overviewItemId === item.id}
                        link={`/overview/${view.id}/${item.id}`}
                        meetingPreparationStartTime={new Date(item.datetime_start)}
                    />
                ))
            ) : (
                <EmptyViewItem
                    header="You have no more meeting preparation tasks!"
                    body="When you have an upcoming calendar event, they will appear here."
                />
            )}
        </>
    )
}

export default MeetingPreparationViewItem
