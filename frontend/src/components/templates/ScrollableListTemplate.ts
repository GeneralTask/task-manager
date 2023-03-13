import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'
import { DEFAULT_VIEW_WIDTH } from '../../styles/dimensions'

const ScrollableListTemplate = styled.div<{ noTopPadding?: boolean; width?: string }>`
    padding: ${({ noTopPadding }) => (noTopPadding ? '0px' : Spacing._32)} ${Spacing._16} 100px;
    overflow-y: auto;
    width: ${({ width }) => width ?? DEFAULT_VIEW_WIDTH};
    background-color: ${Colors.background.base};
`

export default ScrollableListTemplate
