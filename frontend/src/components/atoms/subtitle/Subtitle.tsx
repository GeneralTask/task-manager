import React from 'react'
import styled from 'styled-components'
import { Colors, Typography } from '../../../styles'

const SubtitleStyled = styled.span`
    color: ${Colors.gray._600};
    ${Typography.body};
`
const SubtitleSmallStyles = styled.span`
    color: ${Colors.gray._500};
    ${Typography.bodySmall};
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
