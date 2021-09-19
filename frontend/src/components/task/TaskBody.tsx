import { BORDER_PRIMARY, TEXT_LIGHTGRAY } from '../../helpers/styles'
import { MAX_TASK_BODY_HEIGHT, TASKS_URL } from '../../constants'
import React, { useState } from 'react'
import { connect, useSelector } from 'react-redux'

import { RootState } from '../../redux/store'
import { TTaskSource } from '../../helpers/types'
import { makeAuthorizedRequest } from '../../helpers/utils'
import styled from 'styled-components'

const BodyIframe = styled.iframe<{ iframeHeight: number, }>`
  border: none;
  border-radius: 2px;
  width: 100%;
  height: ${props => props.iframeHeight + 'px'};
  visibility: hidden;
`
const BodyDiv = styled.div`
  margin: auto;
  width: 95%;
  padding: 6px;
`
const Deeplink = styled.div`
  margin: auto;
  text-align: center;
  width: 100%;
  color: black;
`
const ReplyDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
`
const ReplyText = styled.span`
  width: 85%;
  /* min-height: 26px; */
  border: 1px solid ${BORDER_PRIMARY};
  border-radius: 2px;
  padding: 10px;
  cursor: text;
  &:empty:not(:focus):before {
    content: "Enter Response";
    color: ${TEXT_LIGHTGRAY}; 
  }
`
const ReplyButton = styled.button`
  width: 10%;
  height: 42px;
  background-color: black;
  color: white;
  border-radius: 2px;
  border: 2px solid black;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 6px 4px 6px;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
`

interface Props {
  body: string | null,
  task_id: string,
  deeplink: string | null,
  source: TTaskSource,
}

interface BodyHTMLProps {
  body: string,
  task_id: string,
}

interface ReplyProps {
  task_id: string
}


// no body: no body
// has_body, expanded_body != task_id: no body
// has_body, expanded_body == task_id: show body
const TaskBody: React.FC<Props> = ({ body, task_id, deeplink, source }: Props) => {
  const expanded_body = useSelector((state: RootState) => state.expanded_body)
  const has_body = !!(body || deeplink)
  return (
    <div>
      {has_body && expanded_body === task_id && (
        <div>
          {body && (
            <BodyDiv>
              <BodyHTML body={body} task_id={task_id} />
              {source.is_replyable ? <Reply task_id={task_id} /> : null}
            </BodyDiv>
          )}
          {deeplink && (
            <Deeplink>
              <p>
                See more in <a href={deeplink} target="_blank">{source.name}</a>
              </p>
            </Deeplink>
          )}
        </div>
      )}
    </div>
  )
}

const BodyHTML: React.FC<BodyHTMLProps> = ({ body, task_id }: BodyHTMLProps) => {
  return <BodyIframe
    id="expanded-body-html"
    iframeHeight={MAX_TASK_BODY_HEIGHT}
    title={'Body for task: ' + task_id}
    srcDoc={body}
    onLoad={() => {
      const iframe: HTMLIFrameElement | null = document.getElementById('expanded-body-html') as HTMLIFrameElement
      if (iframe && iframe.contentWindow) {
        const height = Math.min(iframe.contentWindow.document.body.offsetHeight + 15, MAX_TASK_BODY_HEIGHT)
        iframe.style.height = height + 'px'
        iframe.style.visibility = 'visible'
      }
    }}
  />
}

const Reply: React.FC<ReplyProps> = ({ task_id }: ReplyProps) => {
  // const [replyText, setReplyText] = useState('')
  // const [textHeight, setTextHeight]
  const [text, setText] = useState('')

  return <ReplyDiv>
    <ReplyText contentEditable onChange={(e) => {
      const replyText = e.currentTarget.textContent
      if (replyText !== null)
        setText(replyText)
    }}></ReplyText>
    <ReplyButton onClick={() => {
      makeAuthorizedRequest({
        url: TASKS_URL + '/reply/' + task_id + '/',
        method: 'POST',
        body: JSON.stringify({ body: text }),
      })
    }}>Reply</ReplyButton>
  </ReplyDiv>
}

export default connect((state: RootState) => ({ expanded_body: state.expanded_body }))(
  TaskBody
)
