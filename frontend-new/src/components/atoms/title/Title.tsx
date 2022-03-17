import React from 'react'
import styled from 'styled-components/native'
import { Colors, Typography } from '../../../styles'

const TitleSmallStyle = styled.Text`
    color: ${Colors.gray._500};
    font-weight: ${Typography.weight._600.fontWeight};
    font-size: ${Typography.small.fontSize}px;
`
const TitleMediumStyle = styled.Text`
    color: ${Colors.gray._700};
    font-weight: ${Typography.weight._600.fontWeight};
    font-size: ${Typography.medium.fontSize}px;
`
const TitleLargeStyle = styled.Text`
    color: ${Colors.gray._700};
    font-weight: ${Typography.weight._600.fontWeight};
    font-size: ${Typography.large.fontSize}px;
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
