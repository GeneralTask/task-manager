import { MAX_TASK_BODY_HEIGHT, TASKS_URL } from '../../constants'
import React, { useEffect, useRef, useState } from 'react'
import { fetchTasks, makeAuthorizedRequest } from '../../helpers/utils'

import { BORDER_PRIMARY } from '../../helpers/styles'
import ContentEditable from 'react-contenteditable'
import GTButton from '../common/GTButton'
import { TTaskSource } from '../../helpers/types'
import styled from 'styled-components'
import { toast } from 'react-toastify'

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
const ExpandedBody = styled.div<{ isExpanded: boolean }>`
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
    sender: string | null,
}

interface BodyHTMLProps {
    body: string,
    task_id: string,
    isExpanded: boolean,
}

interface ReplyProps {
    task_id: string,
    sender: string | null,
}


// no body: no body
// has_body, expanded_body != task_id: no body
// has_body, expanded_body == task_id: show body
const TaskBody: React.FC<Props> = ({ body, task_id, sender, deeplink, source, isExpanded }: Props) => {
    return (
        <div>
            {Boolean(body || deeplink) && (
                <ExpandedBody isExpanded={isExpanded}>
                    {body && (
                        <BodyDiv>
                            <BodyHTML body={body} task_id={task_id} isExpanded={isExpanded} />
                            {source.is_replyable && <Reply task_id={task_id} sender={sender} />}
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

function resizeIframe(iframe: HTMLIFrameElement | null, setIframeHeight: React.Dispatch<React.SetStateAction<number>>, isVisible: boolean) {
    if (isVisible && iframe?.contentWindow?.document) {
        const height = Math.min(iframe.contentWindow.document.body.offsetHeight + 15, MAX_TASK_BODY_HEIGHT)
        iframe.style.visibility = 'visible'
        setIframeHeight(height)
        return height
    }
    return 0
}

const BodyHTML: React.FC<BodyHTMLProps> = ({ body, task_id, isExpanded }: BodyHTMLProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [iframeHeight, setIframeHeight] = useState(0)
    useEffect(() => {
        resizeIframe(iframeRef?.current, setIframeHeight, isExpanded)
    })
    return <BodyIframe
        ref={iframeRef}
        iframeHeight={iframeHeight}
        title={'Body for task: ' + task_id}
        srcDoc={body}
        onLoad={() => {
            resizeIframe(iframeRef?.current, setIframeHeight, isExpanded)
        }}
    />
}
const Reply: React.FC<ReplyProps> = ({ task_id, sender }: ReplyProps) => {
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
            onClick={async () => {
                const response = await makeAuthorizedRequest({
                    url: TASKS_URL + 'reply/' + task_id + '/',
                    method: 'POST',
                    body: JSON.stringify({ body: text }),
                })
                setText('')
                fetchTasks()
                if (response.ok) {
                    toast.success(`Replied to ${sender ?? 'email'}!`)
                }
                else {
                    toast.error(`There was an error replying to ${sender ?? 'email'}`)
                }
            }}
        >
            Reply</GTButton>
    </ReplyDiv>
}

export default TaskBody
