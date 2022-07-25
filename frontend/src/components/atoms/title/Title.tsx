import React from 'react'
import styled from 'styled-components'
import { Colors, Typography } from '../../../styles'

const TitleSmallStyle = styled.span`
    color: ${Colors.text.light};
    font-weight: ${Typography.weight._600};
    font-size: ${Typography.small.fontSize};
    font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
        Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
`
const TitleMediumStyle = styled.span`
    color: ${Colors.text.light};
    font-weight: ${Typography.weight._600};
    font-size: ${Typography.medium.fontSize};
    font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
        Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
`
const TitleLargeStyle = styled.span`
    color: ${Colors.text.light};
    font-weight: ${Typography.weight._600};
    font-size: ${Typography.large.fontSize};
    font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
        Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
`

interface TitleProps {
    children: string
}
export const TitleLarge = ({ children }: TitleProps) => {
    return <TitleLargeStyle>{children}</TitleLargeStyle>
}
export const TitleMedium = ({ children }: TitleProps) => {
    return <TitleMediumStyle>{children}</TitleMediumStyle>
}
export const TitleSmall = ({ children }: TitleProps) => {
    return <TitleSmallStyle>{children}</TitleSmallStyle>
}
