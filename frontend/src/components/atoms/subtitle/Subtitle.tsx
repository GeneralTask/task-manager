import React from 'react'
import styled from 'styled-components'
import { Colors, Typography } from '../../../styles'

const SubtitleStyled = styled.span`
    color: ${Colors.text.light};
    ${Typography.body};
`
const SubtitleSmallStyles = styled.span`
    color: ${Colors.text.light};
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
