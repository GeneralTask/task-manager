import { Border, Colors, Spacing } from "../../styles"

import styled from "styled-components"

export const ColumnWidths = {
    title: '25%',
    status: '25%',
    author: '20%',
    branch: '15%',
    link: '15%',
}

export const Column = styled.div<{ width: string }>`
    width: ${props => props.width};
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