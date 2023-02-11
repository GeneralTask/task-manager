import { ReactNode, useCallback } from 'react'
import { DateTime } from 'luxon'
import sanitizeHtml from 'sanitize-html'
import { EVENT_UNDO_TIMEOUT } from '../../../constants'
import { useKeyboardShortcut, useNavigateToTask, useToast } from '../../../hooks'
import { useDeleteEvent, useGetCalendars } from '../../../services/api/events.hooks'
import { Spacing } from '../../../styles'
import { icons, logos } from '../../../styles/images'
import { TEvent } from '../../../utils/types'
import { emptyFunction } from '../../../utils/utils'
import Flex from '../../atoms/Flex'
import { Icon } from '../../atoms/Icon'
import GTButton from '../../atoms/buttons/GTButton'
import { Label } from '../../atoms/typography/Typography'
import {
    CopyButton,
    Description,
    EventBoxStyle,
    EventHeader,
    EventHeaderIcons,
    EventTitle,
    FlexAnchor,
    IconButton,
} from '../../molecules/EventDetailPopover-styles'
import GTPopover from '../../radix/GTPopover'
import { useCalendarContext } from '../CalendarContext'
import { getCalendarColor } from '../utils/utils'
import CreateEvent from './CreateEvent'

interface EventDetailPopoverProps {
    event: TEvent
    date: DateTime
    hidePopover?: boolean
    children: ReactNode
}
const EventDetailPopover = ({ event, date, hidePopover = false, children }: EventDetailPopoverProps) => {
    const toast = useToast()
    const { selectedEvent, setSelectedEvent, eventDetailType, setEventDetailType } = useCalendarContext()
    const { mutate: deleteEvent, deleteEventInCache, undoDeleteEventInCache } = useDeleteEvent()
    const startTimeString = DateTime.fromISO(event.datetime_start).toFormat('h:mm')
    const endTimeString = DateTime.fromISO(event.datetime_end).toFormat('h:mm a')
    const navigateToTask = useNavigateToTask()
    const { data: calendars } = useGetCalendars()

    const onDelete = useCallback(() => {
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
    }, [event])

    const onCopyMeetingLink = () => {
        navigator.clipboard.writeText(event.conference_call.url)
        toast.show(
            {
                message: 'Meeting link copied to clipboard',
            },
            {
                autoClose: 2000,
                pauseOnFocusLoss: false,
                theme: 'dark',
            }
        )
    }

    useKeyboardShortcut('deleteCalendarEvent', onDelete, event.id !== selectedEvent?.id)

    const calendarAccount = calendars?.find((c) => c.account_id === event.account_id)
    const calendar = calendarAccount?.calendars.find((c) => c.calendar_id === event.calendar_id)

    const content =
        eventDetailType === 'view' ? (
            <EventBoxStyle onClick={(e) => e.stopPropagation()}>
                <EventHeader>
                    <Icon icon={logos[event.logo]} />
                    <EventHeaderIcons>
                        {event.can_modify && (
                            <IconButton onClick={onDelete}>
                                <Icon icon={icons.trash} />
                            </IconButton>
                        )}
                        <IconButton onClick={() => setSelectedEvent(null)}>
                            <Icon icon={icons.x} />
                        </IconButton>
                    </EventHeaderIcons>
                </EventHeader>
                <EventTitle>{event.title}</EventTitle>
                {calendarAccount && calendar && (
                    <Flex gap={Spacing._8}>
                        <Icon icon={icons.square} colorHex={getCalendarColor(event.color_id || calendar.color_id)} />
                        <Label>
                            {calendar.title && calendar.title !== calendarAccount.account_id
                                ? `${calendar.title} (${calendarAccount.account_id})`
                                : calendarAccount.account_id}
                        </Label>
                    </Flex>
                )}
                <Flex gap={Spacing._8}>
                    <Icon icon={icons.calendar_blank} />
                    <Label>
                        {`${date.toFormat('cccc, LLLL d')}`} · {`${startTimeString} - ${endTimeString}`}
                    </Label>
                </Flex>
                <Description dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.body) }} />
                <Flex flex="1" gap={Spacing._8}>
                    {event.linked_task_id && (
                        <GTButton
                            styleType="secondary"
                            size="small"
                            value="View task details"
                            fitContent={false}
                            onClick={() => {
                                setSelectedEvent(null)
                                navigateToTask(event.linked_task_id)
                            }}
                        />
                    )}
                    <FlexAnchor href={event.deeplink}>
                        <GTButton
                            styleType="secondary"
                            size="small"
                            value="Google Calendar"
                            icon={icons.external_link}
                            fitContent={false}
                        />
                    </FlexAnchor>
                </Flex>
                {event.conference_call.logo && (
                    <Flex flex="1" alignItems="center">
                        <FlexAnchor href={event.conference_call.url}>
                            <GTButton
                                styleType="secondary"
                                size="small"
                                value="Join"
                                icon={event.conference_call.logo}
                                fitContent={false}
                            />
                        </FlexAnchor>
                        <CopyButton onClick={onCopyMeetingLink}>
                            <Icon icon={icons.copy} />
                        </CopyButton>
                    </Flex>
                )}
            </EventBoxStyle>
        ) : (
            <CreateEvent
                event={event}
                setEvent={emptyFunction}
                onCancel={() => {
                    setSelectedEvent(null)
                    setEventDetailType('view')
                }}
            />
        )
    return (
        <GTPopover
            isOpen={selectedEvent?.id === event.id}
            setIsOpen={(isOpen) => setSelectedEvent(isOpen ? event : null)}
            content={hidePopover ? undefined : content}
            side="left"
            trigger={children}
            unstyledTrigger
            modal={false}
        />
    )
}

export default EventDetailPopover
