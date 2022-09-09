import styled from 'styled-components'
import { Colors, Typography } from '../../../styles'

const SubtitleStyles = styled.span`
    color: ${Colors.text.black};
    ${Typography.bodySmall};
`
const SubtitleSmallStyles = styled.span`
    color: ${Colors.text.black};
    ${Typography.label};
`

interface SubtitleProps {
    children: string
}
export const Subtitle = ({ children }: SubtitleProps) => {
    return <SubtitleStyles>{children}</SubtitleStyles>
}

export const SubtitleSmall = ({ children }: SubtitleProps) => {
    return <SubtitleSmallStyles>{children}</SubtitleSmallStyles>
}
