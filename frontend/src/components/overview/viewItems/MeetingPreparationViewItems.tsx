import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import { useGetMeetingPreparationTasks } from '../../../services/api/meeting-preparation-tasks.hooks'
import { useGetLinkedAccounts } from '../../../services/api/settings.hooks'
import { isGoogleCalendarLinked } from '../../../utils/utils'
import Spinner from '../../atoms/Spinner'
import ConnectIntegration from '../../molecules/ConnectIntegration'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import EmptyListMessage from './EmptyListMessage'
import { ViewItemsProps } from './viewItems.types'

const MeetingPreparationViewItems = forwardRef(({ view, hideHeader }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
    const { overviewViewId, overviewItemId } = useParams()
    const { data: linkedAccounts } = useGetLinkedAccounts()
    const isGoogleLinked = isGoogleCalendarLinked(linkedAccounts || [])
    const { data: meetingTasks, isLoading: isMeetingTasksLoading } = useGetMeetingPreparationTasks()

    return (
        <>
            {!hideHeader && (
                <ViewHeader ref={ref}>
                    <ViewName>{view.name}</ViewName>
                </ViewHeader>
            )}
            {isMeetingTasksLoading ? (
                <Spinner />
            ) : (
                <>
                    {isGoogleLinked ? (
                        !isMeetingTasksLoading && meetingTasks && meetingTasks?.length > 0 ? (
                            meetingTasks?.map((item, index) => (
                                <Task
                                    key={item.id}
                                    task={item}
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
            )}
        </>
    )
})

export default MeetingPreparationViewItems
