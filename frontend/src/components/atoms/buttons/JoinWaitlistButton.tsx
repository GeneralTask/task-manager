import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../../styles'

const WaitlistButtonStyled = styled.button`
    background-color: ${Colors.gtColor.primary};
    border: none;
    color: ${Colors.text.white};
    padding: 0px ${Spacing._8};
    cursor: pointer;
    ${Typography.bodySmall};
`
interface JointWaitlistButtonProps {
    onSubmit: () => void
}
const JoinWaitlistButton = (props: JointWaitlistButtonProps) => {
    return <WaitlistButtonStyled onClick={props.onSubmit}>Join the Waitlist</WaitlistButtonStyled>
}

export default JoinWaitlistButton
