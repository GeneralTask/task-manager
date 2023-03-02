import styled from 'styled-components'
import { Border, Colors, Shadows } from '../../styles'

const SelectableContainer = styled.div<{ isSelected: boolean }>`
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.small};
    position: relative;
    cursor: pointer;
    box-shadow: ${Shadows.button.default};
    &:hover {
        background-color: ${Colors.background.medium};
        outline: ${Border.stroke.medium} solid ${Colors.background.border};
    }
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
