import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../../styles'
import { icons } from '../../../styles/images'
import { Icon } from '../Icon'

const NoDecorationLink = styled(Link)`
    text-decoration: none;
`
const PurpleText = styled.span`
    color: ${Colors.purple._1};
    font-family: Switzer-Variable;
    font-weight: ${Typography.weight._500.fontWeight};
    font-size: ${Typography.xxSmall.fontSize}px;
    margin-right: ${Spacing.margin.xSmall}px;
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
        <NoDecorationLink to={to} target={target}>
            <VerticalFlex>
                <PurpleText>{text}</PurpleText>
                <Icon size="xxSmall" source={icons.caret_right_purple}></Icon>
            </VerticalFlex>
        </NoDecorationLink>
    )
}

export default RedirectButton
