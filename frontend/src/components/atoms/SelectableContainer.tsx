import styled from 'styled-components'
import { Border, Colors } from '../../styles'

const SelectableContainer = styled.div<{ isSelected: boolean }>`
    background-color: ${(props) => (props.isSelected ? Colors.background.medium : Colors.background.white)};
    box-shadow: ${(props) => (props.isSelected ? `inset 1004px 0px 0px -1000px ${Colors.gtColor.primary}` : 'none')};
    border-radius: ${Border.radius.mini};
    cursor: pointer;
    &:hover {
        background-color: ${Colors.background.medium};
    }
`
export default SelectableContainer
