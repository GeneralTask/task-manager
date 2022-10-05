import { forwardRef } from 'react'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { PurpleEdge } from '../atoms/SelectableContainer'

const ItemContainerDiv = styled.div<{ isSelected: boolean }>`
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    background-color: ${Colors.background.white};
    box-shadow: ${Shadows.button.default};
    border-radius: ${Border.radius.mini};
    :hover {
        outline: ${Border.stroke.medium} solid ${Colors.border.light};
        background-color: ${Colors.background.medium};
    }
    padding: 0 ${Spacing._16};
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`

interface ItemContainerProps {
    isSelected: boolean
    onClick: () => void
    children: React.ReactNode
}
const ItemContainer = forwardRef<HTMLDivElement, ItemContainerProps>(({ isSelected, onClick, children }, ref) => (
    <ItemContainerDiv isSelected={isSelected} onClick={onClick} ref={ref}>
        {isSelected && <PurpleEdge />}
        {children}
    </ItemContainerDiv>
))

export default ItemContainer
