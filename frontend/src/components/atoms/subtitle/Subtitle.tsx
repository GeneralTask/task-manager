import React from 'react'
import styled from 'styled-components'
import { Colors, Typography } from '../../../styles'

const SubtitleStyled = styled.span`
    color: ${Colors.gray._600};
    font-size: ${Typography.small.fontSize};
    font-weight: ${Typography.weight._400};
    font-family: Switzer-Variable;
`
const SubtitleSmallStyles = styled.span`
    color: ${Colors.gray._500};
    font-size: ${Typography.xxSmall.fontSize};
    font-weight: ${Typography.weight._400};
    font-family: Switzer-Variable;
`

interface SubtitleProps {
    children: string
}
export const Subtitle = ({ children }: SubtitleProps) => {
    return <SubtitleStyled>{children}</SubtitleStyled>
}

export const SubtitleSmall = ({ children }: SubtitleProps) => {
    return <SubtitleSmallStyles>{children}</SubtitleSmallStyles>
}
