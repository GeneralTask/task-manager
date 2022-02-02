import styled from 'styled-components'
import { BACKGROUND_HOVER, NoSelect, TEXT_BLACK, TEXT_GRAY } from '../../helpers/styles'

export const DoneButtonContainer = styled.div`
  margin-left: 12px;
`
export const DoneButton = styled.img`
  display: block;
  width: 24px;
  height: 24px;
  flex: none;
  order: 0;
  flex-grow: 0;
  cursor: pointer;
`
export const ButtonRightContainer = styled.div`
  margin-right: 9px;
`
export const ButtonRight = styled.div`
  min-width: 20px;
  height: 20px;
  flex: none;
  order: 0;
  flex-grow: 0;
  cursor: pointer;
  &:hover {
    background-color: ${BACKGROUND_HOVER};
  }
  border-radius: 7px;
`
export const ButtonIcon = styled.img`
  width: 100%;
  height: 100%;
  display: block;
`
export const DueDateButtonText = styled.div`
  font-size: 12px;
  font-weight: bold;
  padding: 0 0.4em;
  background-color: ${BACKGROUND_HOVER};
  outline: 2px solid ${BACKGROUND_HOVER};
  height: 100%;
  border-radius: 7px;
  line-height: 1.7em;
`
export const TimeEstimateButtonText = styled.div`
  font-size: 12px;
  font-weight: bold;
  padding: 0 0.4em;
  position: static;
  outline: 2px solid ${BACKGROUND_HOVER};
  height: 100%;
  border-radius: 7px;
  line-height: 1.7em;
`
export const TaskHeaderContainer = styled(NoSelect) <{ showButtons: boolean }>`
  position: relative;
  font-size: 15px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
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
    display: none; /* hide Deadline Indicator since not yet implemented on backend */
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
export const Icon = styled.img`
    max-width: 19px;
    margin-left: 8px;
`
export const Title = styled.div<{ isExpanded: boolean, isEditable: boolean }>`
    &:focus,:hover {
      ${({ isEditable }) => isEditable ? `
      outline: 1px dashed ${TEXT_GRAY};
      ` : `
      outline: none;`}
    }
    border: none;
    background-color: transparent;
    resize: none;
    font-size: 15px;
    font: inherit;
    color: ${TEXT_BLACK};
    text-overflow: ellipsis;
    user-select: text;
    width: 100%;
    cursor: text;
    ${({ isExpanded }) => isExpanded ? `
    word-wrap: break-word;
    min-width: 0px;
    margin: 10px 15px;
    height: auto;`
    : `
    white-space: nowrap;
    overflow: hidden;
    margin: 0 15px;
    height: 1.2em;`}
`

export const TitleStyle = {
  border: 'none',
  backgroundColor: 'transparent',
  resize: 'none',
  fontSize: '15px',
  font: 'inherit',
  color: '${TEXT_BLACK}',
  textOverflow: 'ellipsis',
  userSelect: 'text',
  width: '100%',
  cursor: 'text',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  margin: '0 15px',
  height: '1.2em',
}

export const TitleStyleExpanded = {
  border: 'none',
  backgroundColor: 'transparent',
  resize: 'none',
  fontSize: '15px',
  font: 'inherit',
  color: '${TEXT_BLACK}',
  textOverflow: 'ellipsis',
  userSelect: 'text',
  width: '100%',
  cursor: 'text',
  wordWrap: 'break-word',
  minWidth: '0px',
  margin: '10px 15px',
  height: 'auto',
}
