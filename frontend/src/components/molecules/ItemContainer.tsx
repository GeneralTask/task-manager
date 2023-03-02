import { MouseEventHandler, forwardRef } from 'react'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { EdgeHighlight } from '../atoms/SelectableContainer'

const ItemContainerDiv = styled.div<{
    isSelected?: boolean
    isMultiSelected?: boolean
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
    ${({ isMultiSelected }) =>
        isMultiSelected &&
        `
        background-color: ${Colors.gtColor.blue}25;
        outline: ${Border.stroke.medium} solid ${Colors.border.light};
    `}
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
    isMultiSelected?: boolean
    isCompact?: boolean
    onClick?: MouseEventHandler
    children: React.ReactNode
    forceHoverStyle?: boolean
    className?: string
}
const ItemContainer = forwardRef<HTMLDivElement, ItemContainerProps>(
    (
        { isSelected, isMultiSelected = false, isCompact = false, onClick, children, forceHoverStyle, className },
        ref
    ) => (
        <ItemContainerDiv
            isSelected={isSelected}
            isMultiSelected={isMultiSelected}
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
