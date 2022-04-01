import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components/native'
import { Colors, Spacing, Typography } from '../../../styles'
import { icons } from '../../../styles/images'
import { Icon } from '../Icon'

const PurpleText = styled.Text`
    color: ${Colors.purple._1};
    font-weight: ${Typography.weight._500.fontWeight};
    margin-right: ${Spacing.margin.xSmall}px;
`

interface RedirectButtonProps {
    to: string
    text: string
    target?: '_blank'
}
const RedirectButton = ({ to, text, target }: RedirectButtonProps) => {
    return (
        <Link to={to} target={target}>
            <PurpleText>{text}</PurpleText>
            <Icon size="xxSmall" source={icons.caret_right_purple}></Icon>
        </Link>
    )
}

export default RedirectButton
