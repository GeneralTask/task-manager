import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { TEvent } from '../../utils/types'
import JoinMeetingButton from '../atoms/buttons/JoinMeetingButton'
import { Bold } from '../atoms/typography/Typography'

const RightAbsoluteContainer = styled.div`
    position: absolute;
    right: ${Spacing._16};
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

interface EventMeetingAction {
    event: TEvent
}
const EventMeetingAction = ({ event }: EventMeetingAction) => {
    const eventHasConfrenceCall = !!event.conference_call.logo
    let eventMessage = null

    if (DateTime.fromISO(event.datetime_end) < DateTime.local()) {
        eventMessage = (
            <>
                <span>This event is</span>
                <Bold> in the past</Bold>.
            </>
        )
    } else if (DateTime.fromISO(event.datetime_start) > DateTime.local()) {
        eventMessage = (
            <>
                <span>This event is</span>
                <Bold> in the future</Bold>.
            </>
        )
    } else {
        eventMessage = (
            <>
                <span>This event is happening</span>
                <Bold> right now</Bold>.
            </>
        )
    }

    return (
        <NotificationMessage isCentered={!eventHasConfrenceCall}>
            <span>{eventMessage}</span>
            {eventHasConfrenceCall && (
                <RightAbsoluteContainer>
                    <JoinMeetingButton conferenceCall={event.conference_call} shortened={false} />
                </RightAbsoluteContainer>
            )}
        </NotificationMessage>
    )
}

export default EventMeetingAction
