import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import { useGetLinkedAccounts } from '../../../services/api/settings.hooks'
import { TTask } from '../../../utils/types'
import { isGoogleCalendarLinked } from '../../../utils/utils'
import ConnectIntegration from '../../molecules/ConnectIntegration'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const MeetingPreparationViewItems = forwardRef(({ view }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
    const { overviewViewId, overviewItemId } = useParams()
    const { data: linkedAccounts } = useGetLinkedAccounts()
    const isGoogleLinked = isGoogleCalendarLinked(linkedAccounts || [])
    return (
        <>
            <ViewHeader ref={ref}>
                <ViewName>{view.name}</ViewName>
            </ViewHeader>
            {isGoogleLinked ? (
                view.view_items.length > 0 ? (
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
                    <>
                        <EmptyViewItem
                            header="You have no more meeting prep for today."
                            body="When you have calendar events scheduled later in the day, they will appear here."
                        />
                    </>
                )
            ) : (
                <ConnectIntegration type="google_calendar" />
            )}
        </>
    )
})

export default MeetingPreparationViewItems
