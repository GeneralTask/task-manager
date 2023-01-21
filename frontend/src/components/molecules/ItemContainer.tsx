import { forwardRef } from 'react'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { BlueEdge } from '../atoms/SelectableContainer'

const ItemContainerDiv = styled.div<{ isSelected?: boolean; padded?: boolean; forceHoverStyle?: boolean }>`
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    background-color: ${Colors.background.white};
    box-shadow: ${Shadows.button.default};
    border-radius: ${Border.radius.mini};
    :hover {
        outline: ${Border.stroke.medium} solid ${Colors.border.light};
        background-color: ${Colors.background.medium};
    }
    ${({ forceHoverStyle }) =>
        forceHoverStyle &&
        `
        outline: ${Border.stroke.medium} solid ${Colors.border.light};
        background-color: ${Colors.background.medium};`}
    padding: 0 ${({ padded }) => (padded ? Spacing._16 : 0)};
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`

interface ItemContainerProps {
    isSelected?: boolean
    padded?: boolean
    onClick?: () => void
    children: React.ReactNode
    forceHoverStyle?: boolean
    className?: string
}
const ItemContainer = forwardRef<HTMLDivElement, ItemContainerProps>(
    ({ isSelected, padded = true, onClick, children, forceHoverStyle, className }, ref) => (
        <ItemContainerDiv
            isSelected={isSelected}
            padded={padded}
            onClick={onClick}
            ref={ref}
            forceHoverStyle={forceHoverStyle}
            className={className}
        >
            {isSelected && <BlueEdge />}
            {children}
        </ItemContainerDiv>
    )
)

export default ItemContainer
