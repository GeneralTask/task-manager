import { MAX_TASK_BODY_HEIGHT, TASKS_URL } from '../../constants'
import React, { useEffect, useRef, useState } from 'react'
import { fetchTasks, makeAuthorizedRequest } from '../../helpers/utils'

import { BORDER_PRIMARY } from '../../helpers/styles'
import ContentEditable from 'react-contenteditable'
import GTButton from '../common/GTButton'
import { TTaskSource } from '../../helpers/types'
import styled from 'styled-components'

const BodyIframe = styled.iframe<{ iframeHeight: number, }>`
  border: none;
  border-radius: 2px;
  width: 100%;
  visibility: hidden;
  height: ${props => props.iframeHeight + 'px'};
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
const ExpandedBody = styled.div<{isExpanded: boolean}>`
    display: ${props => props.isExpanded ? 'block' : 'none'}
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
    isExpanded: boolean,
}

interface BodyHTMLProps {
    body: string,
    task_id: string,
    isExpanded: boolean,
}

interface ReplyProps {
    task_id: string
}


// no body: no body
// has_body, expanded_body != task_id: no body
// has_body, expanded_body == task_id: show body
const TaskBody: React.FC<Props> = ({ body, task_id, deeplink, source, isExpanded }: Props) => {
    return (
        <div>
            {Boolean(body || deeplink) && (
                <ExpandedBody isExpanded={isExpanded}>
                    {body && (
                        <BodyDiv>
                            <BodyHTML body={body} task_id={task_id} isExpanded={isExpanded} />
                            {source.is_replyable && <Reply task_id={task_id} />}
                        </BodyDiv>
                    )}
                    {deeplink && (
                        <Deeplink>
                            <p>
                                See more in <a href={deeplink} target="_blank">{source.name}</a>
                            </p>
                        </Deeplink>
                    )}
                </ExpandedBody>
            )}
        </div>
    )
}

function resizeIframe(iframe: HTMLIFrameElement | null, isVisible: boolean){
    if (isVisible && iframe?.contentWindow) {
        const height = Math.min(iframe.contentWindow.document.body.offsetHeight + 200, MAX_TASK_BODY_HEIGHT)
        iframe.style.height = height + 'px'
        iframe.style.visibility = 'visible'
    }
}

const BodyHTML: React.FC<BodyHTMLProps> = ({ body, task_id, isExpanded }: BodyHTMLProps) => {
    const iframe = useRef<HTMLIFrameElement>(null)
    useEffect(() => {resizeIframe(iframe?.current, isExpanded)})
    return <BodyIframe
        ref={iframe}
        iframeHeight={MAX_TASK_BODY_HEIGHT}
        title={'Body for task: ' + task_id}
        srcDoc={body}
        onLoad={() => {resizeIframe(iframe?.current, isExpanded)}}
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
                fetchTasks()
            }}
        >
            Reply</GTButton>
    </ReplyDiv>
}

export default TaskBody
