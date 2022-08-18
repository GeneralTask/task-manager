import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'

const ScrollableListTemplate = styled.div<{ noTopPadding?: boolean }>`
    padding: ${({ noTopPadding }) => noTopPadding ? '0px' : Spacing.padding._40} ${Spacing.padding._12} 100px;
    overflow-y: auto;
    flex: 1 0;
    background-color: ${Colors.background.light};
`

export default ScrollableListTemplate
