import styled from 'styled-components'
import { Colors, Typography } from '../../styles'

export const MeetingStartText = styled.span<{ isTextColored: boolean }>`
    color: ${({ isTextColored }) => (isTextColored ? `${Colors.text.orange}` : `${Colors.text.light}`)};
    ${Typography.deprecated_label};
    ${Typography.deprecated_bold};
`
