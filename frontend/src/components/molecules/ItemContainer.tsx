import { forwardRef } from 'react'
import styled from 'styled-components'
import { Border, Colors, Spacing } from '../../styles'

const ItemContainerDiv = styled.div<{ isSelected: boolean; isHovered: boolean }>`
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    background-color: ${(props) =>
        props.isSelected || props.isHovered ? Colors.background.medium : Colors.background.white};
    box-shadow: ${(props) => (props.isSelected ? `inset 1005px 0px 0px -1000px ${Colors.gtColor.primary}` : 'none')};
    border-radius: ${Border.radius.small};
    border: ${Border.stroke.medium} solid ${Colors.border.extra_light};
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
        <ItemContainerDiv
            isSelected={isSelected}
            isHovered={isHovered}
            onClick={onClick}
            ref={ref}
            data-testid="list-item"
        >
            {children}
        </ItemContainerDiv>
    )
)

export default ItemContainer
