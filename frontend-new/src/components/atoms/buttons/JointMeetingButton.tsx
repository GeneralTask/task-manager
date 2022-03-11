import React from 'react'
import { Platform } from 'react-native'
import styled from 'styled-components/native'
import { Border, Colors } from '../../../styles'
import { TConferenceCall } from '../../../utils/types'
import { Icon } from '../Icon'

const JoinMeetingButtonContainer = styled.Pressable`
    height: 30px;
    width: 65px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    background-color: ${Colors.gray._700};
    border-radius: ${Border.radius.regular};
`
const ButtonText = styled.Text`
    color: ${Colors.white};
    margin-right: 5px;
`

interface JoinMeetingButtonProps {
    conferenceCall: TConferenceCall
}
const JoinMeetingButton = ({ conferenceCall }: JoinMeetingButtonProps) => {
    function redirectToConferenceCall() {
        if (Platform.OS === 'web') {
            window.location.href = conferenceCall.url
        }
    }
    return (
        <JoinMeetingButtonContainer onPress={() => redirectToConferenceCall()}>
            <ButtonText>Join</ButtonText>
            <Icon size='xSmall' uri={conferenceCall.logo} />
        </JoinMeetingButtonContainer>
    )
}

export default JoinMeetingButton
