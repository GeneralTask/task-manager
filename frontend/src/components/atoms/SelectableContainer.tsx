import styled from 'styled-components'
import { Border, Colors, Shadows } from '../../styles'
import { TItemEdgeColor } from '../../styles/colors'

const SelectableContainer = styled.div<{ isSelected: boolean }>`
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.mini};
    position: relative;
    cursor: pointer;
    box-shadow: ${Shadows.button.default};
    &:hover {
        background-color: ${Colors.background.medium};
        outline: ${Border.stroke.medium} solid ${Colors.border.light};
    }
`

export const EdgeHighlight = styled.div<{ color: TItemEdgeColor; squareStart?: boolean; squareEnd?: boolean }>`
    position: absolute;
    left: 0;
    height: 100%;
    width: 4px;
    background-color: ${(props) => Colors.itemEdge[props.color]};
    border-top-left-radius: ${(props) => (props.squareStart ? '0' : Border.radius.mini)};
    border-bottom-left-radius: ${(props) => (props.squareEnd ? '0' : Border.radius.mini)};
`
export default SelectableContainer
