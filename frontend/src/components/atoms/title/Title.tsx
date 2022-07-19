import React from 'react'
import styled from 'styled-components'
import { Colors, Typography } from '../../../styles'

const TitleSmallStyle = styled.span`
    color: ${Colors.gray._500};
    font-weight: ${Typography.weight._600};
    font-size: ${Typography.small.fontSize};
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
`
const TitleMediumStyle = styled.span`
    color: ${Colors.gray._700};
    font-weight: ${Typography.weight._600};
    font-size: ${Typography.medium.fontSize};
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
`
const TitleLargeStyle = styled.span`
    color: ${Colors.gray._700};
    font-weight: ${Typography.weight._600};
    font-size: ${Typography.large.fontSize};
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
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
