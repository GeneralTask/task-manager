import { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import sanitizeHtml from 'sanitize-html'
import styled from 'styled-components'
import { SINGLE_SECOND_INTERVAL } from '../../constants'
import { useInterval } from '../../hooks'
import { useGetEvents } from '../../services/api/events.hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { focusModeBackground, logos } from '../../styles/images'
import { getMonthsAroundDate } from '../../utils/time'
import { TEvent } from '../../utils/types'
import Flex from '../atoms/Flex'
import GTHeader from '../atoms/GTHeader'
import GTShadowContainer from '../atoms/GTShadowContainer'
import GTStaticCheckbox from '../atoms/GTStaticCheckbox'
import GTTitle from '../atoms/GTTitle'
import { Icon } from '../atoms/Icon'
import TimeRange from '../atoms/TimeRange'
import GTButton from '../atoms/buttons/GTButton'
import JoinMeetingButton from '../atoms/buttons/JoinMeetingButton'
import { useCalendarContext } from '../calendar/CalendarContext'
import CardSwitcher from '../molecules/CardSwitcher'
import SingleViewTemplate from '../templates/SingleViewTemplate'
import CalendarView from '../views/CalendarView'

const TemplateViewContainer = styled.div`
    height: 100%;
    background: url(${focusModeBackground});
    background-size: cover;
`
const FloatingIcon = styled.div`
    position: fixed;
    top: ${Spacing._16};
    left: ${Spacing._16};
`
const FocusModeContainer = styled.div`
    width: 60%;
    height: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    background-color: ${Colors.background.white};
`
const MainContainer = styled.div`
    display: flex;
    min-height: 0;
`
const ClockContainer = styled.div`
    display: flex;
    justify-content: space-between;
    border-top: ${Border.radius.mini} solid ${Colors.border.light};
    ${Typography.header};
    padding: ${Spacing._24} ${Spacing._32};
`
const NotificationMessage = styled.div<{ isCentered?: boolean }>`
    position: relative;
    ${(props) => props.isCentered && `justify-content: center;`}
    border: 1px solid ${Colors.border.light};
    border-radius: ${Border.radius.large};
    display: flex;
    padding: ${Spacing._24} ${Spacing._16};
    align-items: center;
    ${Typography.bodySmall};
`
const NextEventContainer = styled.div`
    ${Typography.body};
`
const AdvanceEventContainer = styled.div`
    position: absolute;
    bottom: ${Spacing._24};
    display: flex;
    align-items: center;
    user-select: none;
    cursor: pointer;
    gap: ${Spacing._8};
    ${Typography.body};
`
const BoldText = styled.span`
    ${Typography.bold};
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
const ButtonContainer = styled.div`
    position: fixed;
    top: ${Spacing._16};
    right: ${Spacing._16};
`
const BodyHeader = styled.div`
    ${Typography.label};
    margin-bottom: ${Spacing._16};
`
const Body = styled.div`
    ${Typography.body};
`
const Subtitle = styled.div`
    ${Typography.subtitle};
`
const CurrentEventsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
`
const CurrentEvent = styled(GTShadowContainer)`
    ${Typography.body};
    display: flex;
    justify-content: space-between;
    border-radius: ${Border.radius.small};
    border: ${Border.stroke.small} solid ${Colors.border.light};
    cursor: pointer;
`
const RightAbsoluteContainer = styled.div`
    position: absolute;
    right: ${Spacing._16};
`

const getTimeUntilNextEvent = (event: TEvent) => {
    const now = DateTime.local()
    const eventStart = DateTime.fromISO(event.datetime_start)
    const minutesUntilEvent = eventStart.diff(now, 'minutes').minutes
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
    const { selectedEvent, setSelectedEvent, setIsPopoverDisabled, setIsCollapsed, setCalendarType } =
        useCalendarContext()
    useLayoutEffect(() => {
        setIsCollapsed(false)
        setCalendarType('day')
        setIsPopoverDisabled(true)
        setSelectedEvent(null)
        return () => {
            setIsPopoverDisabled(false)
            setSelectedEvent(null)
        }
    }, [])
    const blocks = getMonthsAroundDate(DateTime.now(), 1)
    const monthBlocks = blocks.map((block) => ({ startISO: block.start.toISO(), endISO: block.end.toISO() }))
    const { data: events } = useGetEvents(monthBlocks[1], 'calendar')
    const currentEvents = getEventsCurrentlyHappening(events ?? [])
    const [chosenEvent, setChosenEvent] = useState<TEvent | null>(null)
    const [time, setTime] = useState(DateTime.local())

    const [shouldAutoAdvanceEvent, setShouldAutoAdvanceEvent] = useState(true)
    const nextEvent = events?.find((event) => {
        const start = DateTime.fromISO(event.datetime_start)
        return start > time
    })

    useEffect(() => {
        if (currentEvents.length === 1) {
            setChosenEvent(currentEvents[0])
        }
    }, [events])

    useEffect(() => {
        if (selectedEvent) {
            setChosenEvent(selectedEvent)
        }
    }, [selectedEvent])

    const { title, body, datetime_start, datetime_end } = chosenEvent ?? {}
    const timeStart = DateTime.fromISO(datetime_start || '')
    const timeEnd = DateTime.fromISO(datetime_end || '')

    useInterval(
        () => {
            const currentTime = DateTime.local().minus({ seconds: SINGLE_SECOND_INTERVAL })
            setTime(currentTime)
            if (!shouldAutoAdvanceEvent) return
            for (const event of currentEvents) {
                const startTime = DateTime.fromISO(event.datetime_start)
                if (
                    startTime.hour === currentTime.hour &&
                    startTime.minute === currentTime.minute &&
                    currentTime.second === 0
                ) {
                    setChosenEvent(event)
                    return
                }
            }
        },
        SINGLE_SECOND_INTERVAL,
        false
    )

    const conferenceCall = chosenEvent?.conference_call.logo ? chosenEvent.conference_call : null
    const eventHasEnded = DateTime.fromISO(chosenEvent?.datetime_end || '') < DateTime.local()

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
                                                <Flex alignItemsCenter gap={Spacing._8}>
                                                    <Icon icon={logos[event.logo]} />
                                                    <div>{event.title}</div>
                                                </Flex>
                                                <TimeRange
                                                    start={DateTime.fromISO(event.datetime_start)}
                                                    end={DateTime.fromISO(event.datetime_end)}
                                                />
                                            </CurrentEvent>
                                        ))}
                                    </CurrentEventsContainer>
                                </>
                            )}
                            {chosenEvent && (
                                <>
                                    <GTHeader>{title}</GTHeader>
                                    <GTTitle>
                                        <TimeRange start={timeStart} end={timeEnd} />
                                    </GTTitle>
                                    {conferenceCall && (
                                        <NotificationMessage>
                                            <span>
                                                <span>This meeting is happening</span>
                                                <BoldText> right now.</BoldText>
                                            </span>
                                            <RightAbsoluteContainer>
                                                <JoinMeetingButton conferenceCall={conferenceCall} shortened={false} />
                                            </RightAbsoluteContainer>
                                        </NotificationMessage>
                                    )}
                                    {eventHasEnded && (
                                        <NotificationMessage isCentered>
                                            <span>
                                                <span>This event is</span>
                                                <BoldText> in the past.</BoldText>
                                            </span>
                                        </NotificationMessage>
                                    )}
                                    <div>
                                        {chosenEvent.linked_view_id ? (
                                            <CardSwitcher viewId={chosenEvent.linked_view_id} />
                                        ) : (
                                            <>
                                                <BodyHeader>MEETING NOTES</BodyHeader>
                                                <Body dangerouslySetInnerHTML={{ __html: sanitizeHtml(body || '') }} />
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                            {!chosenEvent && currentEvents.length === 0 && <div>No Event</div>}
                        </EventContainer>
                        <CalendarContainer>
                            <CalendarView
                                initialType="day"
                                initialShowDateHeader={false}
                                initialShowMainHeader={false}
                                hideContainerShadow
                            />
                        </CalendarContainer>
                    </MainContainer>
                    <ClockContainer>
                        <NextEventContainer>
                            {nextEvent && (
                                <span>
                                    Next event is in
                                    <BoldText> {getTimeUntilNextEvent(nextEvent)}.</BoldText>
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
                <FloatingIcon>
                    <Icon icon={logos.generaltask} size="gtLogo" />
                </FloatingIcon>
                <ButtonContainer>
                    <GTButton onClick={() => navigate(-1)} value="Exit Focus Mode" styleType="secondary" />
                </ButtonContainer>
            </TemplateViewContainer>
        </SingleViewTemplate>
    )
}

export default FocusModeScreen
