import { ReactNode, useCallback, useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import sanitizeHtml from 'sanitize-html'
import { EVENT_UNDO_TIMEOUT } from '../../constants'
import { useKeyboardShortcut, useNavigateToTask, useToast } from '../../hooks'
import { useDeleteEvent } from '../../services/api/events.hooks'
import { Spacing } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TEvent } from '../../utils/types'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'
import { useCalendarContext } from '../calendar/CalendarContext'
import {
    CopyButton,
    Description,
    EventBoxStyle,
    EventDate,
    EventDateContainer,
    EventHeader,
    EventHeaderIcons,
    EventTitle,
    FlexAnchor,
    IconButton,
} from '../molecules/EventDetailPopover-styles'
import GTPopover from './GTPopover'

interface EventDetailPopoverProps {
    event: TEvent
    date: DateTime
    hidePopover?: boolean
    children: ReactNode
}
const EventDetailPopover = ({ event, date, hidePopover = false, children }: EventDetailPopoverProps) => {
    const toast = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const { setSelectedEvent } = useCalendarContext()
    const { mutate: deleteEvent, deleteEventInCache, undoDeleteEventInCache } = useDeleteEvent()
    const startTimeString = DateTime.fromISO(event.datetime_start).toFormat('h:mm')
    const endTimeString = DateTime.fromISO(event.datetime_end).toFormat('h:mm a')
    const navigateToTask = useNavigateToTask()

    useEffect(() => {
        if (!isOpen) {
            setSelectedEvent(null)
        }
    }, [isOpen])

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

    useKeyboardShortcut(
        'close',
        useCallback(() => setIsOpen(false), [])
    )
    useKeyboardShortcut('deleteCalendarEvent', onDelete)

    const content = (
        <EventBoxStyle>
            <EventHeader>
                <Icon icon={logos[event.logo]} />
                <EventHeaderIcons>
                    <IconButton onClick={onDelete}>
                        <Icon icon={icons.trash} />
                    </IconButton>
                    <IconButton onClick={() => setIsOpen(false)}>
                        <Icon icon={icons.x} />
                    </IconButton>
                </EventHeaderIcons>
            </EventHeader>
            <EventTitle>{event.title}</EventTitle>
            <EventDateContainer>
                <Icon icon={icons.calendar_blank} />
                <EventDate>
                    {`${date.toFormat('cccc, LLLL d')}`} · {`${startTimeString} - ${endTimeString}`}
                </EventDate>
            </EventDateContainer>
            <Description dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.body) }} />
            <Flex flex="1" gap={Spacing._8}>
                {event.linked_task_id && (
                    <GTButton
                        styleType="secondary"
                        size="small"
                        value="View task details"
                        fitContent={false}
                        onClick={() => {
                            setIsOpen(false)
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
    )

    return (
        <GTPopover
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            content={hidePopover ? undefined : content}
            side="left"
            trigger={children}
            unstyledTrigger
            modal={false}
        />
    )
}

export default EventDetailPopover
