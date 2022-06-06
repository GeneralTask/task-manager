import { Colors, Spacing, Typography } from '../../../styles'

import { Icon } from '../Icon'
import { Link } from 'react-router-dom'
import React from 'react'
import { icons } from '../../../styles/images'
import styled from 'styled-components'

const NoDecorationLink = styled(Link)`
    text-decoration: none;
`
const PurpleText = styled.span`
    color: ${Colors.purple._1};
    font-weight: ${Typography.weight._500};
    font-size: ${Typography.xxSmall.fontSize};
    margin-right: ${Spacing.margin._4};
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
