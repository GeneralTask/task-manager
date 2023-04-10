import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../../styles'
import { icons } from '../../../styles/images'
import { Icon } from '../Icon'
import NoStyleLink from '../NoStyleLink'

const PurpleText = styled.span`
    color: ${Colors.legacyColors.purple};
    margin-right: ${Spacing._4};
    ${Typography.body.medium};
`
const VerticalFlex = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`

interface RedirectButtonProps {
    to: string
    text: string
    target?: '_blank'
}
const RedirectButton = ({ to, text, target }: RedirectButtonProps) => {
    return (
        <NoStyleLink to={to} target={target}>
            <VerticalFlex>
                <PurpleText>{text}</PurpleText>
                <Icon icon={icons.caret_right} color="purple"></Icon>
            </VerticalFlex>
        </NoStyleLink>
    )
}

export default RedirectButton
