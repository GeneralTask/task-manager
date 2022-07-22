import React from 'react'
import styled from 'styled-components'
import { Colors, Typography } from '../../../styles'

const TitleSmallStyle = styled.span`
    color: ${Colors.gray._500};
    font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
        Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
    ${Typography.body};
`
const TitleMediumStyle = styled.span`
    color: ${Colors.gray._700};
    font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
        Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
    ${Typography.subtitle};
`
const TitleLargeStyle = styled.span`
    color: ${Colors.gray._700};
    font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
        Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
    ${Typography.title};
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
