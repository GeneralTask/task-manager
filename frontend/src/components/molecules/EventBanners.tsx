import { DateTime } from 'luxon'
import React, { useState } from 'react'
import styled from 'styled-components'
import { EVENTS_REFETCH_INTERVAL, NO_EVENT_TITLE } from '../../constants'
import { useGetEvents } from '../../services/api-query-hooks'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { useInterval } from '../../hooks'
import { TEvent } from '../../utils/types'
import JoinMeetingButton from '../atoms/buttons/JointMeetingButton'

const EventBannerContainer = styled.div`
    display: flex;
    flex-direction: column;
    font-family: Switzer-Variable;
    font-size: ${Typography.xSmall.fontSize};
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    margin-top: 22px;
`
const BannerView = styled.div<{ center: boolean }>`
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: ${(props) => (props.center ? 'center' : 'space-between')};
    align-items: center;
    padding-left: 12px;
    padding-right: 6px;
    margin-bottom: 8px;
    width: 500px;
    height: 50px;
    background-color: ${Colors.white};
    opacity: 0.97;
    border-radius: ${Border.radius.small};
    box-shadow: ${Shadows.large};
`
const BannerTitleView = styled.div`
    background-color: ${Colors.gray._100};
    border-radius: ${Border.radius.xSmall};
    margin-left: 6px;
    margin-right: 6px;
    padding: 2px 7px;
    flex-shrink: 1;
    min-width: 0;
`
const MessageView = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-shrink: 1;
    margin-right: ${Spacing.margin._12}px;
`
const MessageText = styled.span`
    font-weight: ${Typography.weight._500};
    color: ${Colors.gray._600};
`
const OverflowText = styled.span`
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-weight: ${Typography.weight._500};
    color: ${Colors.gray._700};
`

interface EventBannerProps {
    event: TEvent
}
const EventBanner = ({ event }: EventBannerProps) => {
    const timeUntilEvent = Math.ceil((new Date(event.datetime_start).getTime() - new Date().getTime()) / 1000 / 60)
    const timeUntilEventMessage = timeUntilEvent > 0 ? `in ${timeUntilEvent} minutes.` : 'is now.'
    const eventTitle = event.title.length > 0 ? event.title : NO_EVENT_TITLE
    return (
        <BannerView key={event.id} center={event.conference_call == null}>
            <MessageView>
                <MessageText>Your Meeting</MessageText>
                <BannerTitleView>
                    <OverflowText>{eventTitle}</OverflowText>
                </BannerTitleView>
                <MessageText>{timeUntilEventMessage}</MessageText>
            </MessageView>
            {event.conference_call && <JoinMeetingButton conferenceCall={event.conference_call} />}
        </BannerView>
    )
}

const isMeetingWithin15Minutes = (event: TEvent) => {
    const eventStart = DateTime.fromISO(event.datetime_start)
    const eventEnd = DateTime.fromISO(event.datetime_end)
    return eventStart < DateTime.now().plus({ minutes: 15 }) && eventEnd > DateTime.now()
}

interface EventBannersProps {
    date: DateTime
}
const EventBanners = ({ date }: EventBannersProps) => {
    const [eventsWithin15Minutes, setEventsWithin15Minutes] = useState<TEvent[]>([])
    const { data: events, refetch } = useGetEvents(
        {
            startISO: date.startOf('day').toISO(),
            endISO: date.endOf('day').plus({ minutes: 15 }).toISO(),
        },
        'banner'
    )
    useInterval(refetch, EVENTS_REFETCH_INTERVAL)

    useInterval(
        () => {
            const updatedEvents = events?.filter((event) => isMeetingWithin15Minutes(event))
            if (updatedEvents && updatedEvents !== eventsWithin15Minutes) {
                setEventsWithin15Minutes(updatedEvents)
            }
        },
        1,
        false
    )

    if (!eventsWithin15Minutes || eventsWithin15Minutes.length === 0) return null
    return (
        <EventBannerContainer>
            {eventsWithin15Minutes.map((event) => (
                <EventBanner event={event} key={event.id} />
            ))}
        </EventBannerContainer>
    )
}

export default EventBanners
