import styled from 'styled-components'
import { BACKGROUND_HOVER, NoSelect, TEXT_BLACK, TEXT_GRAY, device } from '../../helpers/styles'

export const HeaderLeft = styled.div`
  text-align: left; 
  flex: 1;
  display: flex;
  align-items: center;
  flex-direction: row;
  min-width: 0;
  flex-basis: auto;
`
export const HeaderRight = styled.div`
  display: flex;
  flex: content;
  align-items: center;
  flex-direction: row;
  justify-content: flex-end;
  color:${TEXT_GRAY};
`
export const DragSection = styled.div`
  cursor: grab;
  display: flex;
  align-items: center;
  padding: 0 12px 0 8px;
`
export const Domino = styled.img`
  height: 18px;
`
export const Spacer = styled(DragSection)`
  cursor: pointer;
  visibility: hidden;
  padding: 0;
`
export const Icon = styled.img`
  max-width: 25px;
  padding-right: 12px;
`
export const Title = styled.div`
  color:${TEXT_BLACK};
`
export const TitleWrap = styled(Title)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
export const Truncated = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
// wrapper for Done Button so that it can be hidden by Header
export const HoverButton = styled.div`
  margin-left: 10px;
`
export const Black = styled.span`
  color: ${TEXT_BLACK};
`
export const Space = styled.span`
  width: 0.5ch;
`
export const Header = styled(NoSelect) <{ hoverEffect: boolean, showButtons: boolean }>`
  font-size: 16px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  min-height: 30px;
  padding: 8px 8px 8px 0;
  cursor: ${props => props.hoverEffect ? 'pointer' : 'inherit'};
  &:hover{
    background-color: ${props => props.hoverEffect ? BACKGROUND_HOVER : 'inherit'};
  }
  &:hover > div > ${HoverButton} {
    display: inherit;
  }
  @media ${device.mobile} {
    & > div > ${HoverButton} {
      display: ${props => props.showButtons ? 'inherit' : 'none'};;
    }
  }
  &:hover > div > ${Truncated} {
    display: none;
  }
  & > div > ${Truncated} {
    display: inherit;
  }
`
