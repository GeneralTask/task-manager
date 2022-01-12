import styled from 'styled-components'
import { BACKGROUND_HOVER, NoSelect, TEXT_BLACK, TEXT_GRAY, DOMINO_COLOR } from '../../helpers/styles'

export const DoneButton = styled.img`
  position: static;
  width: 24px;
  height: 24px;
  flex: none;
  order: 0;
  flex-grow: 0;
  margin-left: 12px;
  cursor: pointer;
`
export const ButtonRight = styled.div`
  position: static;
  min-width: 20px;
  height: 20px;
  flex: none;
  order: 0;
  flex-grow: 0;
  margin-right: 5px;
  cursor: pointer;
  &:hover {
    background-color: ${BACKGROUND_HOVER};
  }
  border-radius: 4px;
`
export const ButtonIcon = styled.img`
  position: static;
  width: 100%;
  height: 100%;
`
export const ButtonText = styled.div`
  font-size: 14px;
  padding: 0 0.2em;
  vertical-align: middle;
  position: static;
  background-color: ${BACKGROUND_HOVER};
  height: 100%;
  border-radius: 4px;
`
export const TaskHeaderContainer = styled(NoSelect) <{ hoverEffect: boolean, showButtons: boolean }>`
  position: relative;
  font-size: 15px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: ${props => props.hoverEffect ? 'pointer' : 'inherit'};
  /* &:hover {
    background-color: ${BACKGROUND_HOVER};
  } */
  min-height: 50px;
`
export const HeaderLeft = styled.div`
  box-sizing: border-box;
  text-align: left; 
  display: flex;
  align-items: center;
  flex-direction: row;
  flex-grow: 1;
  min-width: 0;
`
export const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: flex-end;
  color:${TEXT_BLACK};
  height: 100%;
  flex: none;

`
export const JoinConferenceButtonContainer = styled.div`
  margin-right: 10px;
`
export const DeadlineIndicator = styled.div`
  color: ${TEXT_BLACK};
  font-size: 13px;
  margin-right: 5px;
  background-color: ${BACKGROUND_HOVER};
  padding: 4px;
  border-radius: 8px;
  display: flex;
  height: 1.1em;
  display: none;  /* hide Deadline Indicator since not yet implemented on backend */
`
export const CalendarDate = styled.div`
  white-space: nowrap;
  width: fit-content; 
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-right: 5px;
  font-size: 14px;
`
export const CalendarIconContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`
export const CalendarIcon = styled.img`
  width: 1em;
`
export const DragHandler = styled.div`
  cursor: grab;
  display: flex;
  align-items: center;
  cursor: move;
  margin-right: 4px;
  height: 40%;
  display: inline;
`
export const DominoContainer = styled.div`
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  width: 10px;
  align-items: center;
  margin-left: 12px;
`
export const DominoDot = styled.div`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background-color: ${DOMINO_COLOR};
  margin: 1px;
`
export const Icon = styled.img`
  max-width: 19px;
  margin-left: 8px;
`
export const Title = styled.div<{ isExpanded: boolean }>`
  color:${TEXT_BLACK};
  text-overflow: ellipsis;
  user-select: text;
  ${({ isExpanded }) => isExpanded ? `
    word-wrap: break-word;
    min-width: 0px;
    margin: 10px 15px`: `
    white-space: nowrap;
    overflow: hidden;
    margin-left: 15px;`
  }
`
