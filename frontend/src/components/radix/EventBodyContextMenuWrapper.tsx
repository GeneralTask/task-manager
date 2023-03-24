import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { DateTime } from 'luxon'
import { EVENT_UNDO_TIMEOUT } from '../../constants'
import { useNavigateToPullRequest, useNavigateToTask, usePreviewMode, useToast } from '../../hooks'
import { useDeleteEvent } from '../../services/api/events.hooks'
import { icons, logos } from '../../styles/images'
import { TEvent } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'
import { useCalendarContext } from '../calendar/CalendarContext'
import { emit } from '../molecules/toast/Toast'
import GTContextMenu from './GTContextMenu'
import { GTMenuItem } from './RadixUIConstants'

interface FocusModeContextMenuProps {
    event: TEvent
    children: React.ReactNode
}
const FocusModeContextMenuWrapper = ({ event, children }: FocusModeContextMenuProps) => {
    const { mutate: deleteEvent, deleteEventInCache, undoDeleteEventInCache } = useDeleteEvent()
    const navigateToTask = useNavigateToTask()
    const navigateToPullRequest = useNavigateToPullRequest()
    const { setSelectedEvent } = useCalendarContext()
    const oldToast = useToast()
    const { isPreviewMode } = usePreviewMode()

    const onDelete = useCallback(() => {
        if (!event) return
        setSelectedEvent(null)
        const date = DateTime.now()
        deleteEventInCache({
            id: event.id,
            date: date,
            datetime_start: event.datetime_start,
            datetime_end: event.datetime_end,
        })
        if (isPreviewMode) {
            const eventDeleteTimeout = setTimeout(() => {
                deleteEvent(
                    {
                        id: event.id,
                        date: date,
                        datetime_start: event.datetime_start,
                        datetime_end: event.datetime_end,
                    },
                    event.optimisticId
                )
                toast.dismiss(`${event.id}-context`)
            }, EVENT_UNDO_TIMEOUT)
            emit({
                toastId: `${event.id}-context`,
                message: 'This calendar event has been deleted',
                duration: EVENT_UNDO_TIMEOUT,
                undoAction: {
                    onClick: () => {
                        clearTimeout(eventDeleteTimeout)
                        undoDeleteEventInCache(event, date)
                        toast.dismiss(`${event.id}-context`)
                    },
                    onDismiss: () => {
                        clearTimeout(eventDeleteTimeout)
                        deleteEvent(
                            {
                                id: event.id,
                                date: date,
                                datetime_start: event.datetime_start,
                                datetime_end: event.datetime_end,
                            },
                            event.optimisticId
                        )
                    },
                },
            })
        } else {
            oldToast.show(
                {
                    message: 'This calendar event has been deleted',
                    undoableButton: {
                        label: 'Undo',
                        onClick: () => {
                            oldToast.dismiss()
                            undoDeleteEventInCache(event, date)
                        },
                        undoableAction: () =>
                            deleteEvent(
                                {
                                    id: event.id,
                                    date: date,
                                    datetime_start: event.datetime_start,
                                    datetime_end: event.datetime_end,
                                },
                                event.optimisticId
                            ),
                    },
                },
                {
                    autoClose: EVENT_UNDO_TIMEOUT,
                    pauseOnFocusLoss: false,
                    theme: 'dark',
                }
            )
        }
    }, [event, deleteEvent, deleteEventInCache, oldToast, undoDeleteEventInCache])

    const contextMenuItems: GTMenuItem[] = [
        ...(event.linked_task_id
            ? [
                  {
                      label: 'View task details',
                      icon: logos.generaltask,
                      onClick: () => navigateToTask({ taskId: event.linked_task_id }),
                  },
              ]
            : []),
        ...(event.linked_pull_request_id
            ? [
                  {
                      label: 'View PR details',
                      icon: logos.github,
                      onClick: () => navigateToPullRequest(event.linked_pull_request_id),
                  },
              ]
            : []),
        {
            label: 'Go to Google Calendar',
            icon: icons.external_link,
            onClick: () => window.open(event.deeplink, '_blank'),
        },
        {
            label: 'Delete event',
            icon: icons.trash,
            iconColor: 'red',
            textColor: 'red',
            onClick: onDelete,
        },
    ]
    return <GTContextMenu items={contextMenuItems} trigger={children} onOpenChange={emptyFunction} />
}

export default FocusModeContextMenuWrapper
