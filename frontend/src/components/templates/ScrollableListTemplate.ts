import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'
import { DEFAULT_VIEW_WIDTH } from '../../styles/dimensions'

const ScrollableListTemplate = styled.div<{ noTopPadding?: boolean }>`
    padding: ${({ noTopPadding }) => (noTopPadding ? '0px' : Spacing._32)} ${Spacing._16} 100px;
    overflow-y: auto;
    flex: 1 0;
    min-width: ${DEFAULT_VIEW_WIDTH};
    background-color: ${Colors.background.light};
    width: ${DEFAULT_VIEW_WIDTH};
`

export default ScrollableListTemplate
