import { Border, Colors, Spacing } from "../../styles"

import React from "react"
import WebStyled from 'styled-components'

const ItemContainerDiv = WebStyled.div<{ isSelected: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    background-color: ${Colors.white};
    border-radius: ${Border.radius.xxSmall};
    padding: 0 ${Spacing.padding.small}px;
    border: 1px solid ${(props) => (props.isSelected ? Colors.gray._500 : Colors.gray._100)};
`

interface ItemContainerProps {
    isSelected: boolean
    onClick: () => void
    children: React.ReactNode
}
const ItemContainer = React.forwardRef<HTMLDivElement, ItemContainerProps>(
    ({ isSelected, onClick, children }, ref) =>
        <ItemContainerDiv isSelected={isSelected} onClick={onClick} ref={ref}>
            {children}
        </ItemContainerDiv>
)

export default ItemContainer
