import styled from "styled-components"
import { Colors } from "../../styles"

const ScrollableListTemplate = styled.div<{ backgroundColor?: string }>`
    padding: 40px 10px 100px;
    overflow-y: auto;
    flex: 1 0;
    background-color: ${Colors.gray._50};
`

export default ScrollableListTemplate
