import styled from 'styled-components'
import { Border, Colors, Shadows } from '../../styles'

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
export const OrangeEdge = styled.div`
    position: absolute;
    left: 0;
    height: 100%;
    width: 4px;
    background-color: ${Colors.gtColor.orange};
    border-radius: ${Border.radius.mini} 0 0 ${Border.radius.mini};
`
export default SelectableContainer
