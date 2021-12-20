import styled from 'styled-components'
import { TEXT_BLACK } from '../../helpers/styles'

export const BodyIframe = styled.iframe<{ iframeHeight: number, }>`
  border: none;
  border-radius: 2px;
  width: 100%;
  visibility: hidden;
  height: ${props => props.iframeHeight + 'px'};
`
export const TaskBodyDiv = styled.div`
  margin: auto;
  width: 95%;
`
export const EmailViewDiv = styled.div`
  width: auto;
  overflow: scroll;
  height: fit-content;
  max-height: 500px;
  border-radius: 6px;
  padding: 10px;
  margin-top: 10px;
  margin-bottom: 50px;
`
export const EmailSubjectHeader = styled.h4`
  margin-bottom: 20px;
  display: none;
`
export const EmailMessage = styled.div`
  margin: 10px;
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
  width: '100%',
  border: `1px solid ${TEXT_BLACK}`,
  borderRadius: '6px',
  padding: '10px',
  cursor: 'text',
  height: '100px',
  overflow: 'scroll',
  outline: 'none',
  marginRight: '10px',
}
