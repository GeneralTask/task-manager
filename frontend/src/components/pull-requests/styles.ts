import { Border, Colors, Spacing } from "../../styles"

import NoStyleAnchor from "../atoms/NoStyleAnchor"
import styled from "styled-components"

export const ColumnWidths = {
    title: '35%',
    status: '25%',
    author: '20%',
    branch: '15%',
    link: '5%',
}

export const Column = styled.div<{ width: string }>`
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: ${props => props.width};
    padding: ${Spacing.padding._8}px;
    overflow: hidden;
    white-space: nowrap;
`

export const Row = styled.div`
    display: flex;
    padding: ${Spacing.padding._16}px;
`

export const HeaderContainer = styled(Row)`
    background-color: ${Colors.gray._100};
    border-radius: ${Border.radius.large};
    color: ${Colors.gray._500};
`

export const TruncatedText = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

export const LinkButton = styled(NoStyleAnchor)`
    margin: auto;
    padding: ${Spacing.padding._8}px;
    background-color: ${Colors.gray._100};
    border-radius: ${Border.radius.large};
    cursor: pointer;
`
