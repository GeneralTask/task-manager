import styled from "styled-components"
import { Colors } from "../../styles"
import { DEFAULT_VIEW_WIDTH } from "../../styles/dimensions"

const ScrollableListTemplate = styled.div<{ noTopPadding?: boolean }>`
    padding: ${({ noTopPadding }) => noTopPadding ? '0px' : '40px'} 10px 100px;
    overflow-y: auto;
    flex: 1 0;
    min-width: ${DEFAULT_VIEW_WIDTH};
    background-color: ${Colors.gray._50};
`

export default ScrollableListTemplate
