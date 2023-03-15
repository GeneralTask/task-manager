import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'

const SelectableContainer = styled.div<{ isSelected: boolean }>`
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.small};
    position: relative;
    cursor: pointer;
    box-shadow: ${Shadows.deprecated_button.default};
    &:hover {
        background-color: ${Colors.background.sub};
        outline: ${Border.stroke.medium} solid ${Colors.background.border};
    }
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    padding: ${Spacing._12} ${Spacing._8} ${Spacing._12} ${Spacing._16};
    margin-bottom: ${Spacing._4};
    ${Typography.deprecated_bodySmall};
`

export const EdgeHighlight = styled.div<{ color: string; squareStart?: boolean; squareEnd?: boolean }>`
    position: absolute;
    left: 0;
    height: 100%;
    width: 4px;
    background-color: ${(props) => props.color};
    border-top-left-radius: ${(props) => (props.squareStart ? '0' : Border.radius.small)};
    border-bottom-left-radius: ${(props) => (props.squareEnd ? '0' : Border.radius.small)};
`
export default SelectableContainer
