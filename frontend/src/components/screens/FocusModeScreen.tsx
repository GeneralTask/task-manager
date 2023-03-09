import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import sanitizeHtml from 'sanitize-html'
import styled from 'styled-components'
import { EVENT_UNDO_TIMEOUT, NO_TITLE, SINGLE_SECOND_INTERVAL } from '../../constants'
import { useGlobalKeyboardShortcuts, useInterval, useKeyboardShortcut, usePageFocus, useToast } from '../../hooks'
import { useDeleteEvent, useEvents } from '../../services/api/events.hooks'
import Log from '../../services/api/log'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { focusModeBackground, icons, logos } from '../../styles/images'
import { getMonthsAroundDate, isDateToday } from '../../utils/time'
import { TEvent } from '../../utils/types'
import GTHeader from '../atoms/GTHeader'
import GTShadowContainer from '../atoms/GTShadowContainer'
import GTStaticCheckbox from '../atoms/GTStaticCheckbox'
import GTTitle from '../atoms/GTTitle'
import { Icon } from '../atoms/Icon'
import TimeRange from '../atoms/TimeRange'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import GTButton from '../atoms/buttons/GTButton'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import { DeprecatedBold } from '../atoms/typography/Typography'
import { useCalendarContext } from '../calendar/CalendarContext'
import EventMeetingAction from '../focus-mode/EventMeetingAction'
import FlexTime from '../focus-mode/FlexTime'
import CardSwitcher from '../molecules/CardSwitcher'
import CommandPalette from '../molecules/CommandPalette'
import SingleViewTemplate from '../templates/SingleViewTemplate'
import CalendarView from '../views/CalendarView'

const FOCUS_MODE_WIDTH = '956px'

const EventHeaderContainer = styled.div`
    display: flex;
`
const ActionsContainer = styled.div`
    margin-left: auto;
    display: flex;
    height: fit-content;
`
export const IconButton = styled(NoStyleButton)`
    padding: ${Spacing._8};
    border-radius: 50vh;
    &:hover {
        background-color: ${Colors.background.dark};
    }
`
const TemplateViewContainer = styled.div`
    height: 100%;
    background: url(${focusModeBackground});
    background-size: cover;
`
const FloatTopRight = styled.div`
    position: fixed;
    top: ${Spacing._16};
    left: ${Spacing._16};
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
`
const FocusModeContainer = styled.div`
    width: ${FOCUS_MODE_WIDTH};
    height: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    background-color: ${Colors.background.white};
    box-shadow: ${Shadows.deprecated_medium};
`
const MainContainer = styled.div`
    display: flex;
    min-height: 0;
`
// This div uses a hard coded font weight that needs to be updated
const ClockContainer = styled.div`
    display: flex;
    justify-content: space-between;
    border-top: ${Border.radius.small} solid ${Colors.background.border};
    ${Typography.deprecated_header};
    padding: ${Spacing._24} ${Spacing._32};
    font-weight: 274;
`

const NextEventContainer = styled.div`
    ${Typography.deprecated_body};
`
const AdvanceEventContainer = styled.div`
    position: absolute;
    bottom: ${Spacing._24};
    display: flex;
    align-items: center;
    user-select: none;
    cursor: pointer;
    gap: ${Spacing._8};
    ${Typography.deprecated_body};
`
const EventContainer = styled.div`
    padding: ${Spacing._32};
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: ${Spacing._32};
    overflow-y: auto;
`
const CalendarContainer = styled.div`
    margin-left: auto;
`
const FloatTopLeft = styled.div`
    position: fixed;
    top: ${Spacing._16};
    right: ${Spacing._16};
`
const BodyHeader = styled.div`
    ${Typography.deprecated_eyebrow};
    margin-bottom: ${Spacing._16};
`
const Body = styled.div<{ $isEmpty: boolean }>`
    ${({ $isEmpty }) => $isEmpty && `color: ${Colors.text.light};`}
    ${Typography.deprecated_body};
    overflow-wrap: break-word;
`
const Subtitle = styled.div`
    ${Typography.deprecated_subtitle};
`
const CurrentEventsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
`
const CurrentEvent = styled(GTShadowContainer)`
    ${Typography.deprecated_body};
    display: flex;
    justify-content: space-between;
    border-radius: ${Border.radius.medium};
    border: ${Border.stroke.small} solid ${Colors.background.border};
    cursor: pointer;
`

const EventTitle = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    white-space: nowrap;
    min-width: 0;
`
const EventTitleText = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
`

const getTimeUntilNextEvent = (event: TEvent) => {
    const now = DateTime.local()
    const eventStart = DateTime.fromISO(event.datetime_start)
    const minutesUntilEvent = Math.floor(eventStart.diff(now, 'minutes').minutes)
    if (minutesUntilEvent === 1) {
        return '1 minute'
    } else if (minutesUntilEvent < 60) {
        return `${minutesUntilEvent} minutes`
    } else if (minutesUntilEvent < 120) {
        return '1 hour'
    } else {
        return `${Math.floor(minutesUntilEvent / 60)} hours`
    }
}

const getEventsCurrentlyHappening = (events: TEvent[]) => {
    return events?.filter((event) => {
        const now = DateTime.local()
        const start = DateTime.fromISO(event.datetime_start)
        const end = DateTime.fromISO(event.datetime_end)
        return now >= start && now <= end
    })
}

const FocusModeScreen = () => {
    const { selectedEvent, setSelectedEvent, setIsPopoverDisabled, setIsCollapsed, setCalendarType, setDate } =
        useCalendarContext()
    useEffect(() => {
        setIsCollapsed(false)
        setCalendarType('day')
        setDate(DateTime.local())
        setIsPopoverDisabled(true)
        return () => {
            setIsPopoverDisabled(false)
            setSelectedEvent(null)
        }
    }, [])
    const blocks = getMonthsAroundDate(DateTime.now(), 1)
    const monthBlocks = blocks.map((block) => ({ startISO: block.start.toISO(), endISO: block.end.toISO() }))
    const { data: events } = useEvents(monthBlocks[1], 'calendar')
    const currentEvents = getEventsCurrentlyHappening(events ?? [])
    const [chosenEvent, setChosenEvent] = useState<TEvent | null>(null)
    const [time, setTime] = useState(DateTime.local())
    const [shouldAutoAdvanceEvent, setShouldAutoAdvanceEvent] = useState(true)
    usePageFocus(true)

    const nextEvent = events?.find((event) => {
        const eventStart = DateTime.fromISO(event.datetime_start)
        return eventStart.hasSame(time, 'day') && eventStart > time
    })

    useLayoutEffect(() => {
        if (selectedEvent != null) return
        const currentEvents = getEventsCurrentlyHappening(events ?? [])
        if (currentEvents.length === 0 || currentEvents.length > 1) return
        setSelectedEvent(currentEvents[0])
    }, [events])

    const { key: keyLocation } = useLocation()
    const backAction = useCallback(() => {
        // Check if focus mode was opened from landing page or if it was the initial page
        const isInitialLocation = keyLocation === 'default'
        if (isInitialLocation) navigate('/')
        else navigate(-1)
        Log(`leave_focus_mode`)
    }, [keyLocation])
    useKeyboardShortcut('close', backAction)

    useEffect(() => {
        if (currentEvents.length === 0) {
            setChosenEvent(null)
        } else if (currentEvents.length === 1) {
            setChosenEvent(currentEvents[0])
        }
    }, [events])

    useEffect(() => {
        if (selectedEvent) {
            if (!currentEvents.includes(selectedEvent)) {
                setShouldAutoAdvanceEvent(false)
            }
            setChosenEvent(selectedEvent)
        }
    }, [selectedEvent])

    const { title, body, datetime_start, datetime_end } = chosenEvent ?? {}
    const timeStart = DateTime.fromISO(datetime_start || '')
    const timeEnd = DateTime.fromISO(datetime_end || '')

    useInterval(
        () => {
            const currentTime = DateTime.local().plus({ milliseconds: SINGLE_SECOND_INTERVAL })
            setTime(currentTime)
            if (!shouldAutoAdvanceEvent) return
            const isCurrentEventOver = DateTime.fromISO(selectedEvent?.datetime_end || '') < currentTime
            if (!isCurrentEventOver) return
            for (const event of currentEvents) {
                const isCandidateEventOver = DateTime.fromISO(event.datetime_end || '') < currentTime
                if (!isCandidateEventOver) {
                    setChosenEvent(event)
                    setSelectedEvent(event)
                    return
                }
            }
        },
        SINGLE_SECOND_INTERVAL,
        false
    )

    const { mutate: deleteEvent, deleteEventInCache, undoDeleteEventInCache } = useDeleteEvent()
    const gtToast = useToast()
    useGlobalKeyboardShortcuts()

    const onDelete = useCallback(() => {
        if (!chosenEvent) return
        setSelectedEvent(null)
        const date = DateTime.now()
        deleteEventInCache({
            id: chosenEvent.id,
            date: date,
            datetime_start: chosenEvent.datetime_start,
            datetime_end: chosenEvent.datetime_end,
        })
        gtToast.show(
            {
                message: 'This calendar event has been deleted',
                rightAction: {
                    label: 'Undo',
                    onClick: () => {
                        gtToast.dismiss()
                        undoDeleteEventInCache(chosenEvent, date)
                    },
                    undoableAction: () =>
                        deleteEvent(
                            {
                                id: chosenEvent.id,
                                date: date,
                                datetime_start: chosenEvent.datetime_start,
                                datetime_end: chosenEvent.datetime_end,
                            },
                            chosenEvent.optimisticId
                        ),
                },
            },
            {
                autoClose: EVENT_UNDO_TIMEOUT,
                pauseOnFocusLoss: false,
                theme: 'dark',
            }
        )
    }, [chosenEvent, deleteEvent, deleteEventInCache, setSelectedEvent, gtToast, undoDeleteEventInCache])

    const navigate = useNavigate()
    return (
        <SingleViewTemplate>
            <TemplateViewContainer>
                <FocusModeContainer>
                    <MainContainer>
                        <EventContainer>
                            {currentEvents.length > 1 && chosenEvent === null && (
                                <>
                                    <GTHeader>Multiple Events</GTHeader>
                                    <Subtitle>
                                        There are multiple events scheduled for this time period. Please select the
                                        event you want to focus on at the moment.
                                    </Subtitle>
                                    <BodyHeader>MULTIPLE EVENTS — SELECT WHICH EVENT TO FOCUS ON</BodyHeader>
                                    <CurrentEventsContainer>
                                        {currentEvents.map((event) => (
                                            <CurrentEvent key={event.id} onClick={() => setSelectedEvent(event)}>
                                                <EventTitle>
                                                    <Icon icon={logos[event.logo]} />
                                                    <EventTitleText>{event.title || NO_TITLE}</EventTitleText>
                                                </EventTitle>
                                                <TimeRange
                                                    start={DateTime.fromISO(event.datetime_start)}
                                                    end={DateTime.fromISO(event.datetime_end)}
                                                    wrapText={false}
                                                />
                                            </CurrentEvent>
                                        ))}
                                    </CurrentEventsContainer>
                                </>
                            )}
                            {chosenEvent && (
                                <>
                                    <EventHeaderContainer>
                                        <GTHeader>{title || NO_TITLE}</GTHeader>
                                        <ActionsContainer>
                                            <ExternalLinkButton link={chosenEvent.deeplink} />
                                            <IconButton onClick={onDelete}>
                                                <Icon icon={icons.trash} />
                                            </IconButton>
                                        </ActionsContainer>
                                    </EventHeaderContainer>
                                    <GTTitle>
                                        <TimeRange start={timeStart} end={timeEnd} />
                                    </GTTitle>
                                    {chosenEvent && <EventMeetingAction event={chosenEvent} />}
                                    <div>
                                        {chosenEvent.linked_view_id ? (
                                            <CardSwitcher viewId={chosenEvent.linked_view_id} />
                                        ) : (
                                            <>
                                                <BodyHeader>EVENT DESCRIPTON</BodyHeader>
                                                <Body
                                                    dangerouslySetInnerHTML={{
                                                        __html: sanitizeHtml(body || 'No event description set'),
                                                    }}
                                                    $isEmpty={!body}
                                                />
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                            {!chosenEvent && currentEvents.length === 0 && <FlexTime nextEvent={nextEvent} />}
                        </EventContainer>
                        <CalendarContainer>
                            <CalendarView
                                initialType="day"
                                initialShowHeader={false}
                                hideContainerShadow
                                hasLeftBorder
                            />
                        </CalendarContainer>
                    </MainContainer>
                    <ClockContainer>
                        <NextEventContainer>
                            {nextEvent && isDateToday(DateTime.fromISO(nextEvent.datetime_start)) && (
                                <span>
                                    Next event is in
                                    <DeprecatedBold> {getTimeUntilNextEvent(nextEvent)}</DeprecatedBold>.
                                </span>
                            )}
                        </NextEventContainer>
                        <AdvanceEventContainer onClick={() => setShouldAutoAdvanceEvent(!shouldAutoAdvanceEvent)}>
                            <GTStaticCheckbox isChecked={shouldAutoAdvanceEvent} />
                            Automatically advance to next event
                        </AdvanceEventContainer>
                        <span>{time.toFormat('h:mm a')}</span>
                    </ClockContainer>
                </FocusModeContainer>
                <FloatTopRight>
                    <Icon icon={logos.generaltask_single_color} size="gtLogo" />
                    <CommandPalette hideButton />
                </FloatTopRight>
                <FloatTopLeft>
                    <GTButton onClick={backAction} value="Exit Focus Mode" styleType="secondary" />
                </FloatTopLeft>
            </TemplateViewContainer>
        </SingleViewTemplate>
    )
}

export default FocusModeScreen
