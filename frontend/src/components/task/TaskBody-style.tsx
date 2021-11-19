import styled from 'styled-components'
import { BORDER_PRIMARY } from '../../helpers/styles'

export const BodyIframe = styled.iframe<{ iframeHeight: number, }>`
  border: none;
  border-radius: 2px;
  width: 100%;
  visibility: hidden;
  height: ${props => props.iframeHeight + 'px'};
`
export const BodyDiv = styled.div`
  margin: auto;
  width: 95%;
  padding: 6px;
`
export const Deeplink = styled.div`
  margin: auto;
  text-align: center;
  width: 100%;
  color: black;
`
export const ReplyDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
`
export const ExpandedBody = styled.div<{ isExpanded: boolean }>`
    display: ${props => props.isExpanded ? 'block' : 'none'}
`
export const ReplyInputStyle = {
  width: '86%',
  border: `1px solid ${BORDER_PRIMARY}`,
  borderRadius: '2px',
  padding: '10px',
  cursor: 'text',
}
