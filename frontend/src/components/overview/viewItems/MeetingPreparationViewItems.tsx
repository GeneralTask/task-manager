import { Ref, forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import { DONE_FOLDER_ID, TRASH_FOLDER_ID } from '../../../constants'
import { useGetMeetingPreparationTasks } from '../../../services/api/meeting-preparation-tasks.hooks'
import { useGetLinkedAccounts } from '../../../services/api/settings.hooks'
import { isGoogleCalendarLinked } from '../../../utils/utils'
import Skeleton from '../../atoms/Skeleton'
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
    const activeMeetingTasks = meetingTasks?.filter(
        (task) => task.id_folder !== DONE_FOLDER_ID && task.id_folder !== TRASH_FOLDER_ID
    )

    return (
        <>
            {!hideHeader && (
                <ViewHeader ref={ref}>
                    <ViewName>{view.name}</ViewName>
                </ViewHeader>
            )}
            {isMeetingTasksLoading ? (
                <Skeleton />
            ) : (
                <>
                    {isGoogleLinked ? (
                        !isMeetingTasksLoading && activeMeetingTasks && activeMeetingTasks?.length > 0 ? (
                            activeMeetingTasks?.map((item, index) => (
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
