import { RefObject, forwardRef, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import { Id as ToastId } from 'react-toastify'
import { DateTime } from 'luxon'
import sanitizeHtml from 'sanitize-html'
import { EVENT_UNDO_TIMEOUT } from '../../constants'
import { useIsDragging, useKeyboardShortcut, useNavigateToTask, useViewport } from '../../hooks'
import { useDeleteEvent } from '../../services/api/events.hooks'
import { Spacing } from '../../styles'
import { icons, logos } from '../../styles/images'
import toast, { dismissToast } from '../../utils/toast'
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
    Overlay,
} from './EventDetailPopup-styles'

interface EventDetailProps {
    event: TEvent
    date: DateTime
    eventBodyRef: RefObject<HTMLDivElement>
}

const EventDetailPopup = forwardRef<HTMLDivElement, EventDetailProps>(({ event, date, eventBodyRef }, ref) => {
    const { height: windowHeight } = useViewport()
    const { setSelectedEvent } = useCalendarContext()
    const popupRef = useRef<HTMLDivElement | null>(null)
    const undoToastRef = useRef<ToastId>()
    const { mutate: deleteEvent, deleteEventInCache, undoDeleteEventInCache } = useDeleteEvent()
    const onClose = useCallback(() => setSelectedEvent(null), [])

    const startTimeString = DateTime.fromISO(event.datetime_start).toFormat('h:mm')
    const endTimeString = DateTime.fromISO(event.datetime_end).toFormat('h:mm a')
    const navigateToTask = useNavigateToTask()

    const onDelete = useCallback(() => {
        setSelectedEvent(null)
        deleteEventInCache({
            id: event.id,
            date: date,
            datetime_start: event.datetime_start,
            datetime_end: event.datetime_end,
        })
        const timeout = setTimeout(() => {
            deleteEvent({
                id: event.id,
                date: date,
                datetime_start: event.datetime_start,
                datetime_end: event.datetime_end,
            })
        }, EVENT_UNDO_TIMEOUT * 1000)
        undoToastRef.current = toast(
            {
                message: 'This calendar event has been deleted',
                rightAction: {
                    label: 'Undo',
                    onClick: () => {
                        clearTimeout(timeout)
                        dismissToast(undoToastRef.current)
                        undoDeleteEventInCache(event, date)
                    },
                },
            },
            {
                autoClose: EVENT_UNDO_TIMEOUT * 1000,
                pauseOnFocusLoss: false,
                theme: 'dark',
            }
        )
    }, [event])

    useKeyboardShortcut('close', onClose)
    useKeyboardShortcut('deleteCalendarEvent', onDelete)

    // if *anything* drags, close the popup
    const isDragging = useIsDragging()
    if (isDragging) {
        onClose()
        return null
    }

    const onCopyMeetingLink = () => {
        navigator.clipboard.writeText(event.conference_call.url)
        toast(
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

    if (!eventBodyRef.current) return null
    const {
        left: xCoord,
        bottom: yCoord,
        width: eventWidth,
        height: eventHeight,
    } = eventBodyRef.current.getBoundingClientRect()

    const portal = ReactDOM.createPortal(
        <>
            <Overlay onClick={onClose} />
            <EventBoxStyle
                xCoord={xCoord}
                yCoord={yCoord}
                eventHeight={eventHeight}
                eventWidth={eventWidth}
                windowHeight={windowHeight}
                ref={(node) => {
                    popupRef.current = node
                    if (typeof ref === 'function') {
                        ref(node)
                    } else if (ref !== null) {
                        ref.current = node
                    }
                }}
            >
                <EventHeader>
                    <Icon icon={logos[event.logo]} size="xSmall" />
                    <EventHeaderIcons>
                        <IconButton onClick={onDelete}>
                            <Icon icon={icons.trash} size="xSmall" />
                        </IconButton>
                        <IconButton onClick={onClose}>
                            <Icon icon={icons.x} size="xSmall" />
                        </IconButton>
                    </EventHeaderIcons>
                </EventHeader>
                <EventTitle>{event.title}</EventTitle>
                <EventDateContainer>
                    <Icon icon={icons.calendar_blank} size="xSmall" />
                    <EventDate>
                        {`${date.toFormat('cccc, LLLL d')}`} · {`${startTimeString} - ${endTimeString}`}
                    </EventDate>
                </EventDateContainer>
                <Description dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.body) }} />
                <Flex gap={Spacing._8}>
                    {event.linked_task_id && (
                        <GTButton
                            styleType="secondary"
                            size="small"
                            value="View task details"
                            fitContent={false}
                            onClick={() => {
                                onClose()
                                navigateToTask(event.linked_task_id)
                            }}
                        />
                    )}
                    <FlexAnchor href={event.deeplink} target="_blank">
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
                    <Flex alignItemsCenter>
                        <FlexAnchor href={event.conference_call.url} target="_blank">
                            <GTButton
                                styleType="secondary"
                                size="small"
                                value="Join"
                                icon={event.conference_call.logo}
                                fitContent={false}
                            />
                        </FlexAnchor>
                        <CopyButton onClick={onCopyMeetingLink}>
                            <Icon size="xSmall" icon={icons.copy} />
                        </CopyButton>
                    </Flex>
                )}
            </EventBoxStyle>
        </>,
        document.getElementById('event-details-popup') as HTMLElement
    )
    return <>{portal}</>
})

export default EventDetailPopup
