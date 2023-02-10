import { forwardRef } from 'react'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { EdgeHighlight } from '../atoms/SelectableContainer'

const ItemContainerDiv = styled.div<{
    isSelected?: boolean
    isMultiSelect?: boolean
    isCompact?: boolean
    forceHoverStyle?: boolean
}>`
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
        ${({ isMultiSelect }) =>
            !isMultiSelect &&
            `
        background-color: ${Colors.background.medium};
        `})}
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
    border: ${Border.stroke.medium} solid transparent;
    ${({ isMultiSelect }) =>
        isMultiSelect &&
        `
        background-color: ${Colors.gtColor.blue}25;
        outline: ${Border.stroke.medium} solid ${Colors.border.light};
        `}

`

interface ItemContainerProps {
    isSelected?: boolean
    isMultiSelect?: boolean
    isCompact?: boolean
    onClick?: React.MouseEventHandler
    children: React.ReactNode
    forceHoverStyle?: boolean
    className?: string
}
const ItemContainer = forwardRef<HTMLDivElement, ItemContainerProps>(
    ({ isSelected, isCompact = false, onClick, children, forceHoverStyle, className, isMultiSelect }, ref) => (
        <ItemContainerDiv
            isSelected={isSelected}
            isMultiSelect={isMultiSelect}
            isCompact={isCompact}
            onClick={onClick}
            ref={ref}
            forceHoverStyle={forceHoverStyle}
            className={className}
        >
            {isSelected && <EdgeHighlight color={Colors.gtColor.orange} />}
            {children}
        </ItemContainerDiv>
    )
)

export default ItemContainer
