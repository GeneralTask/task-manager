import { DateTime } from 'luxon'
import React from 'react'
import { View } from 'react-native'
import styled from 'styled-components/native'
import { NO_EVENT_TITLE } from '../../constants'
import { useGetEventsQuery } from '../../services/generalTaskApi'
import { Border, Colors, Typography } from '../../styles'
import JoinMeetingButton from '../atoms/buttons/JointMeetingButton'

const EventBannerContainer = styled.View`
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    margin-top: 22px;
`
const BannerView = styled.View<{ center: boolean }>`
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: ${props => props.center ? 'center' : 'space-between'};
    align-items: center;
    padding-left: 12px;
    padding-right: 6px;
    margin-bottom: 8px;
    width: 500px;
    height: 50px;
    background-color: ${Colors.white};
    opacity: 0.97;
    border-radius: ${Border.radius.small};
    box-shadow: 0px 4px 20px rgba(43, 43, 43, 0.08);
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
    margin-right: 12px;
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
    const { data: events, refetch } = useGetEventsQuery({
        startISO: date.toISO(),
        endISO: date.plus({ minutes: 15 }).toISO(),
    })
    setInterval(() => { () => refetch() }, 60000)

    return (
        <EventBannerContainer>
            {
                events?.map((event) => {
                    const timeUntilEvent = Math.ceil(((new Date(event.datetime_start).getTime()) - (new Date()).getTime()) / 1000 / 60)
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
                            {event.conference_call &&
                                <JoinMeetingButton conferenceCall={event.conference_call} />
                            }
                        </BannerView>
                    )
                })
            }
        </EventBannerContainer>
    )
}

export default EventBanner
