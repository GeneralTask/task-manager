import { forwardRef } from 'react'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { PurpleEdge } from '../atoms/SelectableContainer'

const ItemContainerDiv = styled.div<{ isSelected: boolean; isHovered: boolean }>`
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    background-color: ${(props) => (props.isHovered ? Colors.background.medium : Colors.background.white)};
    box-shadow: ${Shadows.button.default};
    border-radius: ${Border.radius.mini};
    ${(props) => props.isHovered && `outline: ${Border.stroke.medium} solid ${Colors.border.light};`};
    padding: 0 ${Spacing._16};
    cursor: pointer;
`

interface ItemContainerProps {
    isSelected: boolean
    isHovered: boolean
    onClick: () => void
    children: React.ReactNode
}
const ItemContainer = forwardRef<HTMLDivElement, ItemContainerProps>(
    ({ isSelected, isHovered, onClick, children }, ref) => (
        <ItemContainerDiv isSelected={isSelected} isHovered={isHovered} onClick={onClick} ref={ref}>
            {isSelected && <PurpleEdge />}
            {children}
        </ItemContainerDiv>
    )
)

export default ItemContainer
