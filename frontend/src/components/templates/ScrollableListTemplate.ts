import styled from "styled-components"
import { Colors } from "../../styles"

const ScrollableListTemplate = styled.div<{ noTopPadding?: boolean }>`
    padding: ${({ noTopPadding }) => noTopPadding ? '0px' : '40px'} 10px 100px;
    overflow-y: auto;
    flex: 1 0;
    background-color: ${Colors.gray._50};
`

export default ScrollableListTemplate
