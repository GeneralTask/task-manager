import { Border, Colors } from '../../../styles'
import { Icon } from '../Icon'
import React from 'react'
import { TConferenceCall } from '../../../utils/types'
import styled from 'styled-components'
import NoStyleButton from './NoStyleButton'
import NoStyleAnchor from '../NoStyleAnchor'

const JoinMeetingButtonContainer = styled(NoStyleButton)`
    height: 30px;
    width: 65px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    background-color: ${Colors.background.dark};
    border-radius: ${Border.radius.medium};
`
const ButtonText = styled.span`
    color: ${Colors.text.white};
    margin-right: 5px;
`

interface JoinMeetingButtonProps {
    conferenceCall: TConferenceCall
}
const JoinMeetingButton = ({ conferenceCall }: JoinMeetingButtonProps) => (
    <NoStyleAnchor href={conferenceCall.url} target="_blank" rel="noreferrer">
        <JoinMeetingButtonContainer>
            <ButtonText>Join</ButtonText>
            <Icon size="xSmall" uri={conferenceCall.logo} />
        </JoinMeetingButtonContainer>
    </NoStyleAnchor>
)

export default JoinMeetingButton
