import { forwardRef } from 'react'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { TItemEdgeColor } from '../../styles/colors'
import { EdgeHighlight } from '../atoms/SelectableContainer'

const ItemContainerDiv = styled.div<{ isSelected?: boolean; isCompact?: boolean; forceHoverStyle?: boolean }>`
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
    edgeColor?: TItemEdgeColor
}
const ItemContainer = forwardRef<HTMLDivElement, ItemContainerProps>(
    ({ isSelected, isCompact = false, onClick, children, forceHoverStyle, className, edgeColor = 'orange' }, ref) => (
        <ItemContainerDiv
            isSelected={isSelected}
            isCompact={isCompact}
            onClick={onClick}
            ref={ref}
            forceHoverStyle={forceHoverStyle}
            className={className}
        >
            {isSelected && <EdgeHighlight color={edgeColor} />}
            {children}
        </ItemContainerDiv>
    )
)

export default ItemContainer
