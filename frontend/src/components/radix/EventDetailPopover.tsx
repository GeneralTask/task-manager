import { ReactNode, useCallback, useEffect, useState } from 'react'
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
import {
    CopyButton,
    Description,
    EventBoxStyle,
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
    const { isPreviewMode } = usePreviewMode()

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
                <EventHeaderIcons>
                    <FlexAnchor href={event.deeplink}>
                        <IconButton>
                            <Icon icon={icons.external_link} />
                        </IconButton>
                    </FlexAnchor>
                    {event.can_modify && (
                        <IconButton onClick={onDelete}>
                            <Icon icon={icons.trash} />
                        </IconButton>
                    )}
                    <IconButton onClick={() => setIsOpen(false)}>
                        <Icon icon={icons.x} />
                    </IconButton>
                </EventHeaderIcons>
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
                        size="small"
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
                        size="small"
                        value="View PR details"
                        fitContent={false}
                        onClick={() => {
                            setIsOpen(false)
                            navigateToPullRequest(event.linked_pull_request_id)
                        }}
                    />
                )}
                {isPreviewMode && (
                    <GTButton
                        styleType="secondary"
                        size="small"
                        value="Meeting Notes"
                        icon={icons.note}
                        fitContent={false}
                        onClick={() => {
                            setIsOpen(false)
                            const note = notes?.find((n) => n.linked_event_id === event.id && !n.is_deleted)
                            const id = note ? note.id : createMeetingNote()
                            navigate(`/notes/${id}`)
                        }}
                    />
                )}
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
