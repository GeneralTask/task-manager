import styled from 'styled-components'
import { Border, Colors } from '../../styles'

const SelectableContainer = styled.div<{ isSelected: boolean }>`
    background-color: ${(props) => (props.isSelected ? Colors.background.medium : Colors.background.white)};
    border-radius: ${Border.radius.mini};
    position: relative;
    cursor: pointer;
    &:hover {
        background-color: ${Colors.background.medium};
    }
`
export const PurpleEdge = styled.div`
    position: absolute;
    left: 0;
    height: 100%;
    width: 4px;
    background-color: ${Colors.gtColor.primary};
    border-radius: ${Border.radius.mini} 0 0 ${Border.radius.mini};
`
export default SelectableContainer
