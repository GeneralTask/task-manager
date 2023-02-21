import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import { useGetLinkedAccounts } from '../../../services/api/settings.hooks'
import { TTaskV4 } from '../../../utils/types'
import { isGoogleCalendarLinked } from '../../../utils/utils'
import ConnectIntegration from '../../molecules/ConnectIntegration'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import EmptyListMessage from './EmptyListMessage'
import { ViewItemsProps } from './viewItems.types'

const MeetingPreparationViewItems = forwardRef(({ view, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
    const { overviewViewId, overviewItemId } = useParams()
    const { data: linkedAccounts } = useGetLinkedAccounts()
    const isGoogleLinked = isGoogleCalendarLinked(linkedAccounts || [])

    return (
        <>
            {!hideHeader && (
                <ViewHeader ref={ref}>
                    <ViewName>{view.name}</ViewName>
                </ViewHeader>
            )}
            {isGoogleLinked ? (
                view.view_items.length > 0 ? (
                    view.view_items.map((item, index) => (
                        <Task
                            key={item.id}
                            task={item as TTaskV4}
                            dragDisabled={true}
                            index={index}
                            isSelected={overviewViewId === view.id && overviewItemId === item.id}
                            link={`/overview/${view.id}/${item.id}`}
                        />
                    ))
                ) : (
                    <EmptyListMessage list={view} />
                )
            ) : (
                <ConnectIntegration type="google_calendar" />
            )}
        </>
    )
})

export default MeetingPreparationViewItems
