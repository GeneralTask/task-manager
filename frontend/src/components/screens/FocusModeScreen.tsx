import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import sanitizeHtml from 'sanitize-html'
import styled from 'styled-components'
import { useInterval } from '../../hooks'
import { useGetEvents } from '../../services/api/events.hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { focusModeBackground, logos } from '../../styles/images'
import { getMonthsAroundDate } from '../../utils/time'
import { TEvent } from '../../utils/types'
import Flex from '../atoms/Flex'
import GTHeader from '../atoms/GTHeader'
import GTShadowContainer from '../atoms/GTShadowContainer'
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
    border-top: ${Border.radius.mini} solid ${Colors.border.light};
    ${Typography.header};
    padding: ${Spacing._24} ${Spacing._32};
    text-align: right;
`
const JoinMeetingContainer = styled.div`
    border: 1px solid ${Colors.border.light};
    border-radius: ${Border.radius.large};
    display: flex;
    padding: ${Spacing._8} ${Spacing._16};
    align-items: center;
    justify-content: space-between;
    ${Typography.bodySmall};
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

const getEventsCurrentlyHappening = (events: TEvent[]) => {
    return events?.filter((event) => {
        const now = DateTime.local()
        const start = DateTime.fromISO(event.datetime_start)
        const end = DateTime.fromISO(event.datetime_end)
        return now >= start && now <= end
    })
}

const FocusModeScreen = () => {
    const { selectedEvent, setSelectedEvent, setIsPopoverDisabled } = useCalendarContext()
    useEffect(() => {
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
            setTime(DateTime.local())
        },
        1,
        false
    )

    const conferenceCall = chosenEvent?.conference_call.logo ? chosenEvent.conference_call : null

    const navigate = useNavigate()
    return (
        <SingleViewTemplate>
            <TemplateViewContainer>
                <FocusModeContainer>
                    <MainContainer>
                        <EventContainer>
                            {currentEvents.length > 0 && chosenEvent === null && (
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
                                        <JoinMeetingContainer>
                                            <span>
                                                <span>This meeting is happening</span>
                                                <BoldText> right now.</BoldText>
                                            </span>
                                            <JoinMeetingButton conferenceCall={conferenceCall} shortened={false} />
                                        </JoinMeetingContainer>
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
                    <ClockContainer>{time.toFormat('h:mm a')}</ClockContainer>
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
