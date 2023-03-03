import { forwardRef } from 'react'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { EdgeHighlight } from '../atoms/SelectableContainer'

const ItemContainerDiv = styled.div<{ isSelected?: boolean; isCompact?: boolean; forceHoverStyle?: boolean }>`
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    background-color: ${Colors.background.white};
    box-shadow: ${Shadows.deprecated_button.default};
    border-radius: ${Border.radius.small};
    :hover {
        outline: ${Border.stroke.medium} solid ${Colors.background.border};
        background-color: ${Colors.background.medium};
    }
    ${({ forceHoverStyle }) =>
        forceHoverStyle &&
        `
        outline: ${Border.stroke.medium} solid ${Colors.background.border};
        background-color: ${Colors.background.medium};`}
    padding: 0 ${({ isCompact }) => (isCompact ? `${Spacing._4} 0 0` : Spacing._16)};
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`

interface ItemContainerProps {
    isSelected?: boolean
    isCompact?: boolean
    onClick?: () => void
    children: React.ReactNode
    forceHoverStyle?: boolean
    className?: string
}
const ItemContainer = forwardRef<HTMLDivElement, ItemContainerProps>(
    ({ isSelected, isCompact = false, onClick, children, forceHoverStyle, className }, ref) => (
        <ItemContainerDiv
            isSelected={isSelected}
            isCompact={isCompact}
            onClick={onClick}
            ref={ref}
            forceHoverStyle={forceHoverStyle}
            className={className}
        >
            {isSelected && <EdgeHighlight color={Colors.legacyColors.orange} />}
            {children}
        </ItemContainerDiv>
    )
)

export default ItemContainer
