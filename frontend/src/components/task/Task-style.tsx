import { BORDER_PRIMARY, BORDER_SELECTED_TASK, SHADOW_EXPANDED, SHADOW_PRIMARY } from '../../helpers/styles'
import styled, { css } from 'styled-components'

export const DraggableContainer = styled.div`
    width: 60%;
    min-width: 500px;
    margin: 5px 0;
    position: relative;
`

export const TaskContainer = styled.div<{
    opacity: number
    isExpanded: boolean
    showKeyboardIndicator: boolean
}>`
    padding: 0;
    font-family: 'Ellipsis', 'Gothic A1', sans-serif;
    border-radius: 12px;
    width: 100%;
    outline: none;
    background-color: white;
    opacity: ${(props) => props.opacity};
    min-height: 45px;
    box-shadow: ${(props) => (props.isExpanded ? SHADOW_EXPANDED : SHADOW_PRIMARY)};
    border: 2.5px solid ${(props) => (props.showKeyboardIndicator ? BORDER_SELECTED_TASK : 'white')};
`

const DropIndicatorStyles = css<{ isVisible: boolean }>`
    flex-grow: 1;
    height: 0px;
    position: absolute;
    left: 0px;
    right: 0px;
    color: ${BORDER_PRIMARY};
    border-color: ${BORDER_PRIMARY};
    background-color: ${BORDER_PRIMARY};
    visibility: ${(props) => (props.isVisible ? 'visible' : 'hidden')};
`

export const DropIndicatorAbove = styled.hr`
    ${DropIndicatorStyles}
    margin-top: -5px;
`

export const DropIndicatorBelow = styled.hr`
    ${DropIndicatorStyles}
    margin-top: 5.0px;
`
