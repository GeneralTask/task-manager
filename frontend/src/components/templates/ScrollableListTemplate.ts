import styled from "styled-components"

const ScrollableListTemplate = styled.div<{ backgroundColor?: string }>`
    padding: 40px 10px 100px;
    overflow-y: auto;
    margin-right: auto;
    flex: 1 0;
    background-color: ${props => props.backgroundColor || "white"};
`

export default ScrollableListTemplate
