import { Border, Colors, Shadows, Spacing } from '../../styles'

import React from 'react'
import styled from 'styled-components'

const ItemContainerDiv = styled.div<{ isSelected: boolean; isUnread: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    border-radius: ${Border.radius.large};
    padding: 0 ${Spacing.padding._8};
    border: 2px solid ${(props) => (props.isSelected ? Colors.purple._3 : 'transparent')};
    box-shadow: ${(props) => (props.isSelected ? Shadows.xSmall : 'none')};
    background-color: ${(props) => (props.isSelected || props.isUnread ? Colors.white : 'transparent')};
    cursor: pointer;
`

interface ItemContainerProps {
    isSelected: boolean
    isUnread: boolean
    onClick: () => void
    children: React.ReactNode
}
const ItemContainer = React.forwardRef<HTMLDivElement, ItemContainerProps>(
    ({ isSelected, isUnread, onClick, children }, ref) => (
        <ItemContainerDiv isSelected={isSelected} isUnread={isUnread} onClick={onClick} ref={ref}>
            {children}
        </ItemContainerDiv>
    )
)

export default ItemContainer
