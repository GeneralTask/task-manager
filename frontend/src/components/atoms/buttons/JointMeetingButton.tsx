import { Border, Colors } from '../../../styles'
import { Linking, Platform } from 'react-native'

import { Icon } from '../Icon'
import React from 'react'
import { TConferenceCall } from '../../../utils/types'
import styled from 'styled-components/native'

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
    if (Platform.OS === 'web') {
        return (
            <a href={conferenceCall.url} target="_blank" rel="noreferrer">
                <JoinMeetingButtonContainer>
                    <ButtonText>Join</ButtonText>
                    <Icon size="xSmall" uri={conferenceCall.logo} />
                </JoinMeetingButtonContainer>
            </a>
        )
    } else {
        return (
            <JoinMeetingButtonContainer onPress={() => Linking.openURL(conferenceCall.url)}>
                <ButtonText>Join</ButtonText>
                <Icon size="xSmall" uri={conferenceCall.logo} />
            </JoinMeetingButtonContainer>
        )
    }
}

export default JoinMeetingButton
