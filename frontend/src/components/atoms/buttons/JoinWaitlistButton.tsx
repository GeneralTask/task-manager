import React from 'react'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../../styles'

const WaitlistButtonStyled = styled.button`
    background-color: ${Colors.purple._1};
    border: none;
    color: ${Colors.white};
    font-family: Switzer-Variable;
    font-size: ${Typography.small.fontSize}px;
    padding: 0px ${Spacing.padding.small}px;
    cursor: pointer;
`
interface JointWaitlistButtonProps {
    onSubmit: () => void
}
const JoinWaitlistButton = (props: JointWaitlistButtonProps) => {
    return <WaitlistButtonStyled onClick={props.onSubmit}>Join the Waitlist</WaitlistButtonStyled>
}

export default JoinWaitlistButton
