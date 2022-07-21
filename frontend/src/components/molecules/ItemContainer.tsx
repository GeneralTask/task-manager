import { Border, Colors, Spacing } from '../../styles'

import React from 'react'
import styled from 'styled-components'

const ItemContainerDiv = styled.div<{ isSelected: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.large};
    padding: 0 ${Spacing.padding._8};
    border: 1px solid ${(props) => (props.isSelected ? Colors.background.dark : Colors.background.mid)};
    cursor: pointer;
`

interface ItemContainerProps {
    isSelected: boolean
    onClick: () => void
    children: React.ReactNode
}
const ItemContainer = React.forwardRef<HTMLDivElement, ItemContainerProps>(({ isSelected, onClick, children }, ref) => (
    <ItemContainerDiv isSelected={isSelected} onClick={onClick} ref={ref} data-testid="list-item">
        {children}
    </ItemContainerDiv>
))

export default ItemContainer
