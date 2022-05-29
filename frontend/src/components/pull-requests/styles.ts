import { Border, Colors, Spacing } from "../../styles"

import styled from "styled-components"

export const ColumnWidths = {
    title: '30%',
    status: '30%',
    author: '20%',
    branch: '15%',
    link: '5%',
}

export const Column = styled.div<{ width: string }>`
    width: ${props => props.width};
    padding: ${Spacing.padding._8}px;
    overflow: hidden;
    text-overflow: ellipsis;
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

export const TruncatedText = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`