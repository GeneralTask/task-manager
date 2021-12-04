import { MAX_TASK_BODY_HEIGHT, TASKS_URL } from '../../constants'
import React, { useEffect, useRef, useState } from 'react'
import { fetchTasks, makeAuthorizedRequest, useDeviceSize } from '../../helpers/utils'

import ContentEditable from 'react-contenteditable'
import GTButton from '../common/GTButton'
import { TTaskSource } from '../../helpers/types'
import { toast } from 'react-toastify'
import { BodyIframe, BodyDiv, Deeplink, ReplyDiv, ExpandedBody, ReplyInputStyle } from './TaskBody-style'
import sanitizeHtml from 'sanitize-html'
import ReactDOMServer from 'react-dom/server'
import { BORDER_PRIMARY } from '../../helpers/styles'
import styled from 'styled-components'
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
    body: string,
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
                            {source.is_replyable && <Reply task_id={task_id} sender={sender} body={body} />}
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
    if (isVisible && iframe?.contentWindow?.document != null) {
        let height = Math.min(
            iframe.contentWindow.document.querySelector('html')?.offsetHeight
            ?? iframe.contentWindow.document.body.offsetHeight,
            MAX_TASK_BODY_HEIGHT
        )
        height += 5
        iframe.style.visibility = 'visible'
        setIframeHeight(height)
        return height
    }
    return 0
}

const BodyHTML: React.FC<BodyHTMLProps> = ({ body, task_id, isExpanded }: BodyHTMLProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [iframeHeight, setIframeHeight] = useState(0)
    useDeviceSize()
    useEffect(() => {
        resizeIframe(iframeRef?.current, setIframeHeight, isExpanded)
    }, [isExpanded, body])
    return <BodyIframe
        ref={iframeRef}
        iframeHeight={iframeHeight}
        title={'Body for task: ' + task_id}
        srcDoc={body}
    />
}

const EmailBlock = styled.blockquote`
    margin: 0px 0px 0px 0.8ex;
    border-left: 1px solid ${BORDER_PRIMARY};
    padding-left: 1ex;
`
interface EmailQuoteProps {
    body: string
}

function EmailQuote({ body }: EmailQuoteProps): JSX.Element {
    const whitelistedHTMLAttributes: sanitizeHtml.IOptions = {
        allowedAttributes: false,
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img'])
    }
    return (
        <div>
            <br />
            <EmailBlock>
                <div
                    className="quotedResponse"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(body, whitelistedHTMLAttributes) }}
                />
            </EmailBlock>
        </div >
    )
}


const Reply: React.FC<ReplyProps> = ({ task_id, sender, body }: ReplyProps) => {
    const [text, setText] = useState(ReactDOMServer.renderToStaticMarkup(<EmailQuote body={body} />))

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
    </ReplyDiv >
}

export default TaskBody
