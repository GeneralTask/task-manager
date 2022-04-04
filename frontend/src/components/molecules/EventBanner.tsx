import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { EVENTS_REFETCH_INTERVAL, NO_EVENT_TITLE } from '../../constants'

import { DateTime } from 'luxon'
import JoinMeetingButton from '../atoms/buttons/JointMeetingButton'
import React from 'react'
import { View } from 'react-native'
import WebStyled from 'styled-components'
import styled from 'styled-components/native'
import { useGetEvents } from '../../services/api-query-hooks'
import { useInterval } from '../../utils/hooks'

const EventBannerContainer = styled.View`
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    margin-top: 22px;
`
const BannerView = WebStyled.div<{ center: boolean }>`
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
const BannerTitleView = styled.View`
    background-color: ${Colors.gray._100};
    border-radius: ${Border.radius.xSmall};
    margin-left: 6px;
    margin-right: 6px;
    padding: 2px 7px;
    flex-shrink: 1;
    min-width: 0;
`
const MessageView = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-shrink: 1;
    margin-right: ${Spacing.margin._12}px;
`
const MessageText = styled.Text`
    font-weight: ${Typography.weight._500.fontWeight};
    color: ${Colors.gray._600};
`
const OverflowText = styled.Text`
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-weight: ${Typography.weight._500.fontWeight};
    color: ${Colors.gray._700};
`
interface EventBannerProps {
    date: DateTime
}
const EventBanner = ({ date }: EventBannerProps) => {
    const { data: events, refetch } = useGetEvents(
        {
            startISO: date.toISO(),
            endISO: date.plus({ minutes: 15 }).toISO(),
        },
        'banner'
    )

    useInterval(refetch, EVENTS_REFETCH_INTERVAL)

    if (!events || events.length === 0) return null
    return (
        <EventBannerContainer>
            {events?.map((event) => {
                const timeUntilEvent = Math.ceil(
                    (new Date(event.datetime_start).getTime() - new Date().getTime()) / 1000 / 60
                )
                const timeUntilEventMessage = timeUntilEvent > 0 ? `in ${timeUntilEvent} minutes.` : 'is now.'
                const eventTitle = event.title.length > 0 ? event.title : NO_EVENT_TITLE
                return (
                    <BannerView key={event.id} center={event.conference_call == null}>
                        <MessageView>
                            <View>
                                <MessageText>Your Meeting</MessageText>
                            </View>
                            <BannerTitleView>
                                <OverflowText>{eventTitle}</OverflowText>
                            </BannerTitleView>
                            <View>
                                <MessageText>{timeUntilEventMessage}</MessageText>
                            </View>
                        </MessageView>
                        {event.conference_call && <JoinMeetingButton conferenceCall={event.conference_call} />}
                    </BannerView>
                )
            })}
        </EventBannerContainer>
    )
}

export default EventBanner
