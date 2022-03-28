import React from 'react'
import { Button } from 'react-native'
import { Colors } from '../../../styles'

const JoinWaitlistButton = (props: { onSubmit: () => void }) => {
    return <Button color={Colors.purple._1} onPress={props.onSubmit} title={'Join the Waitlist'} />
}

export default JoinWaitlistButton
