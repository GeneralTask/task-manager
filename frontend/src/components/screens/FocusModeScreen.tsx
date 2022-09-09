import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import sanitizeHtml from 'sanitize-html'
import styled from 'styled-components'
import { useGetEvents } from '../../services/api/events.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { getMonthsAroundDate } from '../../utils/time'
import { TEvent } from '../../utils/types'
import GTHeader from '../atoms/GTHeader'
import GTTitle from '../atoms/GTTitle'
import { Icon } from '../atoms/Icon'
import TimeRange from '../atoms/TimeRange'
import GTButton from '../atoms/buttons/GTButton'
import SingleViewTemplate from '../templates/SingleViewTemplate'
import CalendarView from '../views/CalendarView'

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
    background-color ${Colors.background.white};

`
const MainContainer = styled.div`
    display: flex;
    min-height: 0;
`
const ClockContainer = styled.div`
    border-top: 3px solid ${Colors.border.light};
    ${Typography.header};
    padding: ${Spacing._24} ${Spacing._32};
    text-align: right;
    font-weight: 274;
`
const EventContainer = styled.div`
    padding: ${Spacing._32};
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: ${Spacing._32};
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
    letter-spacing: 0.12em;
    margin-bottom: ${Spacing._16};
`
const Body = styled.div`
    ${Typography.body};
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
    const blocks = getMonthsAroundDate(DateTime.now(), 1)
    const monthBlocks = blocks.map((block) => ({ startISO: block.start.toISO(), endISO: block.end.toISO() }))
    const { data: events } = useGetEvents(monthBlocks[1], 'calendar')
    const currentEvents = getEventsCurrentlyHappening(events ?? [])

    const { title, body, datetime_start, datetime_end } = currentEvents[0] ?? {}
    const timeStart = DateTime.fromISO(datetime_start)
    const timeEnd = DateTime.fromISO(datetime_end)

    const clockTime = DateTime.local().toFormat('h:mm a')

    const navigate = useNavigate()
    return (
        <SingleViewTemplate>
            <div style={{ backgroundColor: Colors.background.light, height: '100%' }}>
                <FocusModeContainer>
                    <MainContainer>
                        <EventContainer>
                            {currentEvents.length > 0 ? (
                                <>
                                    <GTHeader>{title}</GTHeader>
                                    <GTTitle>
                                        <TimeRange start={timeStart} end={timeEnd} />
                                    </GTTitle>
                                    <div>
                                        <BodyHeader>MEETING NOTES</BodyHeader>
                                        <Body dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }} />
                                    </div>
                                </>
                            ) : (
                                <div>No Event</div>
                            )}
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
                    <ClockContainer>{clockTime}</ClockContainer>
                </FocusModeContainer>
                <FloatingIcon>
                    <Icon icon={logos.generaltask} size="medium" />
                </FloatingIcon>
                <ButtonContainer>
                    <GTButton onClick={() => navigate(-1)} value="Exit Focus Mode" styleType="secondary" />
                </ButtonContainer>
            </div>
        </SingleViewTemplate>
    )
}

export default FocusModeScreen
