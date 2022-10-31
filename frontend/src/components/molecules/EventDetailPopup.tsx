import { forwardRef, useCallback, useLayoutEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { DateTime } from 'luxon'
import sanitizeHtml from 'sanitize-html'
import { EVENT_UNDO_TIMEOUT } from '../../constants'
import { useIsDragging, useKeyboardShortcut, useNavigateToTask, useToast } from '../../hooks'
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
    Overlay,
} from './EventDetailPopup-styles'

interface EventDetailProps {
    event: TEvent
    date: DateTime
    xCoord: number
    yCoord: number
    eventHeight: number
    eventWidth: number
    windowHeight: number
}

const EventDetailPopup = forwardRef<HTMLDivElement, EventDetailProps>(
    ({ event, date, xCoord, yCoord, eventHeight, eventWidth, windowHeight }, ref) => {
        const toast = useToast()
        const { setSelectedEvent } = useCalendarContext()
        const popupRef = useRef<HTMLDivElement | null>(null)
        const { mutate: deleteEvent, deleteEventInCache, undoDeleteEventInCache } = useDeleteEvent()
        const [popupHeight, setPopupHeight] = useState(0)
        useLayoutEffect(() => {
            if (!popupRef.current) return
            setPopupHeight(popupRef.current.getBoundingClientRect().height)
        }, [])
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
                            deleteEvent({
                                id: event.id,
                                date: date,
                                datetime_start: event.datetime_start,
                                datetime_end: event.datetime_end,
                            }),
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

        const portal = ReactDOM.createPortal(
            <>
                <Overlay onClick={onClose} />
                <EventBoxStyle
                    xCoord={xCoord}
                    yCoord={yCoord}
                    popupHeight={popupHeight}
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
                        <Icon icon={logos[event.logo]} />
                        <EventHeaderIcons>
                            <IconButton onClick={onDelete}>
                                <Icon icon={icons.trash} />
                            </IconButton>
                            <IconButton onClick={onClose}>
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
                                    onClose()
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
            </>,
            document.getElementById('event-details-popup') as HTMLElement
        )

        return <>{portal}</>
    }
)

export default EventDetailPopup
