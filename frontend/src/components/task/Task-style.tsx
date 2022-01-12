import styled, { css } from 'styled-components'
import { BORDER_PRIMARY, SHADOW_EXPANDED, SHADOW_PRIMARY } from '../../helpers/styles'


export const DraggableContainer = styled.div`
    width: 60%;
    min-width: 500px;
    margin: 5px 0;
    position: relative;
`

export const TaskContainer = styled.div<{ opacity: number, isExpanded: boolean }>`
  padding: 0;
  font-family: 'Ellipsis', 'Gothic A1', sans-serif;
  /* border: 1px solid ${BORDER_PRIMARY}; */
  border-radius: 12px;
  width: 100%;
  outline: none;
  background-color: white;
  opacity: ${props => props.opacity};
  min-height: 50px;
  box-shadow: ${props => props.isExpanded ? SHADOW_EXPANDED : SHADOW_PRIMARY};
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
    visibility: ${props => props.isVisible ? 'visible' : 'hidden'};
`

export const DropIndicatorAbove = styled.hr`
    ${DropIndicatorStyles}
    margin-top: -5px;
`

export const DropIndicatorBelow = styled.hr`
    ${DropIndicatorStyles}
    margin-top: 5.0px;
`
