import { DateTime } from 'luxon'
import React, { useState } from 'react'
import styled from 'styled-components'
import { NO_EVENT_TITLE, SINGLE_SECOND_INTERVAL } from '../../constants'
import { useGetEvents } from '../../services/api/events.hooks'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { useInterval } from '../../hooks'
import { TEvent } from '../../utils/types'
import JoinMeetingButton from '../atoms/buttons/JointMeetingButton'

const EventBannerContainer = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    margin-top: 22px;
    ${Typography.bodySmall};
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
    max-width: 450px;
    height: 50px;
    background-color: ${Colors.background.white};
    opacity: 0.97;
    border-radius: ${Border.radius.small};
    box-shadow: ${Shadows.medium};
`
const BannerTitleView = styled.div`
    background-color: ${Colors.background.medium};
    border-radius: ${Border.radius.small};
    margin-left: 6px;
    margin-right: 6px;
    padding: 2px 7px;
    flex-shrink: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
`
const MessageView = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-shrink: 1;
    margin-right: ${Spacing.small};
    min-width: 0px;
`
const MessageText = styled.span`
    white-space: nowrap;
    color: ${Colors.text.light};
    ${Typography.bodySmall};
`
const OverflowText = styled.span`
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    color: ${Colors.text.light};
    ${Typography.bodySmall};
`

interface EventBannerProps {
    event: TEvent
}
const EventBanner = ({ event }: EventBannerProps) => {
    const timeUntilEvent = Math.ceil((new Date(event.datetime_start).getTime() - new Date().getTime()) / 1000 / 60)
    const timeUntilEventMessage = timeUntilEvent > 0 ? `is in ${timeUntilEvent} minutes.` : 'is now.'
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
    const { data: events } = useGetEvents(
        {
            startISO: date.startOf('day').toISO(),
            endISO: date.endOf('day').plus({ minutes: 15 }).toISO(),
        },
        'banner'
    )

    useInterval(
        () => {
            const updatedEvents = events?.filter((event) => isMeetingWithin15Minutes(event))
            if (updatedEvents && updatedEvents !== eventsWithin15Minutes) {
                setEventsWithin15Minutes(updatedEvents)
            }
        },
        SINGLE_SECOND_INTERVAL,
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
