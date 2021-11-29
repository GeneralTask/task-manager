import { BACKGROUND_HOVER, DIVIDER_LIGHTGRAY, TEXT_GRAY } from '../../helpers/styles'

import styled from 'styled-components'

export const TaskSectionHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  color: ${TEXT_GRAY};
`
export const Spanbar = styled.div`
  display: flex;
  background-color: ${DIVIDER_LIGHTGRAY};
  height: 1px;
  flex: 1;
  border-left: 1px solid ${DIVIDER_LIGHTGRAY};
  border-right: 1px solid ${DIVIDER_LIGHTGRAY};
  border-radius: 2px;
`
export const TimeAnnotation = styled.div`
  display: flex;
  width: 15%;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
`
export const TimeAnnotationRight = styled(TimeAnnotation)`
  justify-content: flex-start;
`
export const InsideHeader = styled.div<{ isOver: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60%;
  margin-left: 4px;
  background-color: ${props => props.isOver ? BACKGROUND_HOVER : 'inherit'};
  border-radius: 2px;
  height:100%;
`
export const HeaderText = styled.div`
  font-size: 28px;
  margin: 0 40px;
`
export const CurrentTimeText = styled.div<{ isShown: boolean }>`
  font-size: 18px;
  font-weight: 600;
  padding-right: 10px;
  visibility: ${props => props.isShown ? 'visible' : 'hidden'};
`
export const CurrentTimeContainer = styled.div`
  cursor: pointer;
`