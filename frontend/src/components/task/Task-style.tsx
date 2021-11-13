import styled, { css } from 'styled-components'
import { BORDER_PRIMARY } from '../../helpers/styles'


export const DraggableContainer = styled.div`
    margin: 5px 0;
    position: relative;
`

export const ContainerStyles = css<{ opacity: number }>`
  padding: 0;
  font-family: 'Ellipsis', 'Gothic A1', sans-serif;
  border: 1px solid ${BORDER_PRIMARY};
  border-radius: 2px;
  width: 100%;
  outline: none;
  background-color: white;
  opacity: ${props => props.opacity}
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

export const DropIndicatorAboveStyles = css`
    ${DropIndicatorStyles}
    margin-top: -5px;
`
export const DropIndicatorBelowStyles = css`
    ${DropIndicatorStyles}
    margin-top: 5.0px;
`
