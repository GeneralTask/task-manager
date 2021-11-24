import styled, { css } from 'styled-components'
import { BORDER_PRIMARY } from '../../helpers/styles'

export const DropOverlay = styled.div`
    width: 100%;
    height: 100%;
    position: absolute;
    right: 0%;
`

export const DraggableContainer = styled.div`
    margin: 5px 0;
    position: relative;
`

export const Container = styled.div<{ opacity: number }>`
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

export const DropIndicatorAbove = styled.hr`
    ${DropIndicatorStyles}
    margin-top: -5px;
`

export const DropIndicatorBelow = styled.hr`
    ${DropIndicatorStyles}
    margin-top: 5.0px;
`
