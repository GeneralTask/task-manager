import { useCallback } from 'react'
import { DateTime } from 'luxon'
import { EVENT_UNDO_TIMEOUT } from '../../constants'
import { useToast } from '../../hooks'
import { useDeleteEvent } from '../../services/api/events.hooks'
import { icons } from '../../styles/images'
import { TEvent } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'
import { useCalendarContext } from '../calendar/CalendarContext'
import GTContextMenu from './GTContextMenu'
import { GTMenuItem } from './RadixUIConstants'

interface FocusModeContextMenuProps {
    event: TEvent
    children: React.ReactNode
}
const FocusModeContextMenuWrapper = ({ event, children }: FocusModeContextMenuProps) => {
    const { mutate: deleteEvent, deleteEventInCache, undoDeleteEventInCache } = useDeleteEvent()
    const { setSelectedEvent } = useCalendarContext()
    const toast = useToast()

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
        toast.show(
            {
                message: 'This calendar event has been deleted',
                rightAction: {
                    label: 'Undo',
                    onClick: () => {
                        toast.dismiss()
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
    }, [event, deleteEvent, deleteEventInCache, toast, undoDeleteEventInCache])

    const contextMenuItems: GTMenuItem[] = [
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
