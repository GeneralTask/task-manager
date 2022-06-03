import { Colors, Spacing, Typography } from '../../../styles'

import React from 'react'
import styled from 'styled-components'

const WaitlistButtonStyled = styled.button`
    background-color: ${Colors.purple._1};
    border: none;
    color: ${Colors.white};
    font-size: ${Typography.small.fontSize};
    padding: 0px ${Spacing.padding._8};
    cursor: pointer;
`
interface JointWaitlistButtonProps {
    onSubmit: () => void
}
const JoinWaitlistButton = (props: JointWaitlistButtonProps) => {
    return <WaitlistButtonStyled onClick={props.onSubmit}>Join the Waitlist</WaitlistButtonStyled>
}

export default JoinWaitlistButton
