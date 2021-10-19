import { BORDER_PRIMARY } from '../../helpers/styles'
import { MAX_TASK_BODY_HEIGHT, TASKS_URL } from '../../constants'
import React, { useState } from 'react'
import { connect, useSelector } from 'react-redux'

import { RootState } from '../../redux/store'
import { TTaskSource } from '../../helpers/types'
import { makeAuthorizedRequest } from '../../helpers/utils'
import styled from 'styled-components'
import GTButton from '../common/GTButton'
import ContentEditable from 'react-contenteditable'

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
const ReplyInputStyle = {
  width: '86%',
  border: `1px solid ${BORDER_PRIMARY}`,
  borderRadius: '2px',
  padding: '10px',
  cursor: 'text',
}

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
  const [text, setText] = useState('')

  return <ReplyDiv>
    <ContentEditable
      className="reply-input"
      html={text}
      style={ReplyInputStyle}
      onChange={(e) => setText(e.target.value)}
    />
    <GTButton
      theme="black"
      height="42px"
      width="10%"
      onClick={() => {
        makeAuthorizedRequest({
          url: TASKS_URL + 'reply/' + task_id + '/',
          method: 'POST',
          body: JSON.stringify({ body: text }),
        })
        setText('')
      }}
    >
      Reply</GTButton>
  </ReplyDiv>
}

export default connect((state: RootState) => ({ expanded_body: state.expanded_body }))(
  TaskBody
)
