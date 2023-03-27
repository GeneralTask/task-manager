import { ReactNode, useCallback, useEffect, useState } from 'react'
import { toast as hotToast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import sanitizeHtml from 'sanitize-html'
import { v4 as uuidv4 } from 'uuid'
import { EVENT_UNDO_TIMEOUT, NO_TITLE } from '../../constants'
import { useKeyboardShortcut, useNavigateToPullRequest, useNavigateToTask, usePreviewMode, useToast } from '../../hooks'
import { useDeleteEvent, useGetCalendars } from '../../services/api/events.hooks'
import { useCreateNote, useGetNotes } from '../../services/api/notes.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Spacing } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TEvent } from '../../utils/types'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'
import { DeprecatedLabel } from '../atoms/typography/Typography'
import { useCalendarContext } from '../calendar/CalendarContext'
import { Description, EventBoxStyle, EventHeader, EventTitle, FlexAnchor } from '../molecules/EventDetailPopover-styles'
import { toast } from '../molecules/toast'
import GTPopover from './GTPopover'

interface EventDetailPopoverProps {
    event: TEvent
    date: DateTime
    hidePopover?: boolean
    children: ReactNode
}
const EventDetailPopover = ({ event, date, hidePopover = false, children }: EventDetailPopoverProps) => {
    const oldToast = useToast()
    const { isPreviewMode } = usePreviewMode()
    const [isOpen, setIsOpen] = useState(false)
    const { selectedEvent, setSelectedEvent } = useCalendarContext()
    const { mutate: deleteEvent, deleteEventInCache, undoDeleteEventInCache } = useDeleteEvent()
    const startTimeString = DateTime.fromISO(event.datetime_start).toFormat('h:mm')
    const endTimeString = DateTime.fromISO(event.datetime_end).toFormat('h:mm a')
    const navigateToTask = useNavigateToTask()
    const navigateToPullRequest = useNavigateToPullRequest()
    const { data: notes } = useGetNotes()
    const { mutate: createNote } = useCreateNote()
    const { data: userInfo } = useGetUserInfo()
    const { data: calendars } = useGetCalendars()
    const navigate = useNavigate()

    useEffect(() => {
        if (isOpen || hidePopover) return
        setSelectedEvent(null)
    }, [isOpen])

    const onDelete = useCallback(() => {
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
                hotToast.dismiss(`${event.id}-popover`)
            }, EVENT_UNDO_TIMEOUT)
            toast('This calendar event has been deleted', {
                toastId: `${event.id}-popover`,
                duration: EVENT_UNDO_TIMEOUT,
                undoAction: {
                    onClick: () => {
                        clearTimeout(eventDeleteTimeout)
                        undoDeleteEventInCache(event, date)
                        hotToast.dismiss(`${event.id}-popover`)
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
    }, [event])

    const onCopyMeetingLink = () => {
        navigator.clipboard.writeText(event.conference_call.url)
        if (isPreviewMode) {
            toast('Meeting link copied to clipboard')
        } else {
            oldToast.show(
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
    }

    const createMeetingNote = () => {
        const optimisticId = uuidv4()
        createNote({
            title: event.title || NO_TITLE,
            author: userInfo?.name || 'Anonymous',
            linked_event_id: event.id,
            linked_event_start: event.datetime_start,
            linked_event_end: event.datetime_end,
            optimisticId,
        })
        navigate(`/notes/${optimisticId}`)
        return optimisticId
    }

    useKeyboardShortcut(
        'close',
        useCallback(() => setIsOpen(false), [])
    )
    useKeyboardShortcut('deleteCalendarEvent', onDelete, event.id !== selectedEvent?.id)

    const calendarAccount = calendars?.find((c) => c.account_id === event.account_id)
    const calendar = calendarAccount?.calendars.find((c) => c.calendar_id === event.calendar_id)

    const content = (
        <EventBoxStyle>
            <EventHeader>
                <Icon icon={logos[event.logo]} />
                <EventTitle>{event.title || NO_TITLE}</EventTitle>
                <Flex alignItems="center" gap={Spacing._4}>
                    <FlexAnchor href={event.deeplink}>
                        <GTButton styleType="icon" icon={icons.external_link} />
                    </FlexAnchor>
                    {event.can_modify && <GTButton styleType="icon" icon={icons.trash} onClick={onDelete} />}
                    <GTButton styleType="icon" icon={icons.x} onClick={() => setIsOpen(false)} autoFocus />
                </Flex>
            </EventHeader>
            {calendarAccount && calendar && (
                <Flex gap={Spacing._8}>
                    <Icon icon={icons.square} colorHex={calendar.color_background} />
                    <DeprecatedLabel>
                        {calendar.title && calendar.title !== calendarAccount.account_id
                            ? `${calendar.title} (${calendarAccount.account_id})`
                            : calendarAccount.account_id}
                    </DeprecatedLabel>
                </Flex>
            )}
            <Flex gap={Spacing._8}>
                <Icon icon={icons.calendar_blank} />
                <DeprecatedLabel>
                    {`${date.toFormat('cccc, LLLL d')}`} · {`${startTimeString} - ${endTimeString}`}
                </DeprecatedLabel>
            </Flex>
            <Description dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.body) }} />
            <Flex flex="1" gap={Spacing._8}>
                {event.linked_task_id && (
                    <GTButton
                        styleType="secondary"
                        value="View task details"
                        fitContent={false}
                        onClick={() => {
                            setIsOpen(false)
                            navigateToTask({ taskId: event.linked_task_id })
                        }}
                    />
                )}
                {event.linked_pull_request_id && (
                    <GTButton
                        styleType="secondary"
                        value="View PR details"
                        fitContent={false}
                        onClick={() => {
                            setIsOpen(false)
                            navigateToPullRequest(event.linked_pull_request_id)
                        }}
                    />
                )}
                <GTButton
                    styleType="secondary"
                    value="Meeting Notes"
                    icon={icons.note}
                    fitContent={false}
                    onClick={() => {
                        setIsOpen(false)
                        if (event.linked_note_id) {
                            navigate(`/notes/${event.linked_note_id}`)
                            return
                        }
                        const note = notes?.find((n) => n.linked_event_id === event.id && !n.is_deleted)
                        const id = note ? note.id : createMeetingNote()
                        navigate(`/notes/${id}`)
                    }}
                />
            </Flex>
            {event.conference_call.logo && (
                <Flex flex="1" alignItems="center" gap={Spacing._4}>
                    <FlexAnchor href={event.conference_call.url}>
                        <GTButton
                            styleType="secondary"
                            value="Join"
                            icon={event.conference_call.logo}
                            fitContent={false}
                        />
                    </FlexAnchor>
                    <GTButton styleType="icon" icon={icons.copy} onClick={onCopyMeetingLink} />
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
        />
    )
}

export default EventDetailPopover
