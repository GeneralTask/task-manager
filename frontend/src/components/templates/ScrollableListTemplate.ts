import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'
import { DEFAULT_VIEW_WIDTH } from '../../styles/dimensions'

const ScrollableListTemplate = styled.div<{ width?: string }>`
    padding: ${Spacing._32} ${Spacing._16} 100px;
    overflow-y: auto;
    width: ${({ width }) => width ?? DEFAULT_VIEW_WIDTH};
    background-color: ${Colors.background.base};
    border-right: 1px solid ${Colors.background.border};
`

export default ScrollableListTemplate
