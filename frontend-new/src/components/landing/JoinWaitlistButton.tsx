import React from 'react'
import { Button } from 'react-native'

const JoinWaitlistButton = (props: { onSubmit: () => void }) => {
    return <Button onPress={props.onSubmit} title={'Join the Waitlist'} />
}

export default JoinWaitlistButton
