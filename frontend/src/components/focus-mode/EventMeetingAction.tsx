import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { TEvent } from '../../utils/types'
import JoinMeetingButton from '../atoms/buttons/JoinMeetingButton'
import { DeprecatedBold } from '../atoms/typography/Typography'

const NotificationMessage = styled.div<{ isCentered?: boolean }>`
    justify-content: ${({ isCentered }) => (isCentered ? `center` : `space-between`)};
    border: 1px solid ${Colors.background.border};
    border-radius: ${Border.radius.large};
    display: flex;
    padding: ${Spacing._24} ${Spacing._16};
    align-items: center;
    ${Typography.deprecated_bodySmall};
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
                <DeprecatedBold> in the past</DeprecatedBold>.
            </>
        )
    } else if (DateTime.fromISO(event.datetime_start) > DateTime.local()) {
        eventMessage = (
            <>
                <span>This event is</span>
                <DeprecatedBold> in the future</DeprecatedBold>.
            </>
        )
    } else {
        eventMessage = (
            <>
                <span>This event is happening</span>
                <DeprecatedBold> right now</DeprecatedBold>.
            </>
        )
    }

    return (
        <NotificationMessage isCentered={!eventHasConfrenceCall}>
            <span>{eventMessage}</span>
            {eventHasConfrenceCall && <JoinMeetingButton conferenceCall={event.conference_call} shortened={false} />}
        </NotificationMessage>
    )
}

export default EventMeetingAction
