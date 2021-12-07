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
import { BORDER_PRIMARY, TEXT_GRAY } from '../../helpers/styles'

interface Props {
    body: string | null,
    task_id: string,
    deeplink: string | null,
    source: TTaskSource,
    isExpanded: boolean,
    sender: string | null,
    emailSender: string | null,
    emailSentTime: string | null,
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
    emailSender: string | null,
    emailSentTime: string | null,
}


// no body: no body
// has_body, expanded_body != task_id: no body
// has_body, expanded_body == task_id: show body
const TaskBody: React.FC<Props> = ({ body, task_id, sender, deeplink, source, isExpanded, emailSender, emailSentTime }: Props) => {
    return (
        <div>
            {Boolean(body || deeplink) && (
                <ExpandedBody isExpanded={isExpanded}>
                    {body && (
                        <BodyDiv>
                            <BodyHTML body={body} task_id={task_id} isExpanded={isExpanded} />
                            {source.is_replyable && <Reply task_id={task_id} sender={sender} body={body} emailSender={emailSender} emailSentTime={emailSentTime} />}
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

interface EmailQuoteProps {
    sender: string | null,
    body: string,
    emailSender: string | null,
    emailSentTime: string | null,
}

function EmailQuote({ sender, body, emailSender, emailSentTime }: EmailQuoteProps): JSX.Element {
    const whitelistedHTMLAttributes: sanitizeHtml.IOptions = {
        allowedAttributes: false,
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img'])
    }
    const emailDate = new Date(emailSentTime || '')
    const month = emailDate.toLocaleString('default', { month: 'short' })
    const hours = emailDate.getHours()
    const minutes = emailDate.getMinutes()
    const date = emailDate.getDate()
    const year = emailDate.getFullYear()

    let timeString = ''
    if (hours > 12) timeString = `${hours - 12}:${minutes} PM`
    else timeString = `${hours}:${minutes} AM`

    const emailSenderQuote = `On ${month} ${date}, ${year} at ${timeString},
     ${sender} <${emailSender}> wrote:`

    return (
        <div>
            <div style={{ color: 'black' }}>
                <br />
            </div>
            <div style={{
                color: `${TEXT_GRAY}`,
                fontSize: 'small',
            }}>
                {sender && emailSender && emailSentTime && <div>{emailSenderQuote}</div>}
                <br />
                <div style={{
                    margin: '0px 0px 0px 0.8ex',
                    borderLeft: `1px solid ${BORDER_PRIMARY}`,
                    paddingLeft: '1ex'
                }}>
                    <div
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(body, whitelistedHTMLAttributes) }}
                    />
                </div>
            </div >
        </div >
    )
}


const Reply: React.FC<ReplyProps> = ({ task_id, sender, body, emailSender, emailSentTime }: ReplyProps) => {
    const [text, setText] = useState(ReactDOMServer.renderToStaticMarkup(<EmailQuote sender={sender} body={body} emailSender={emailSender} emailSentTime={emailSentTime} />))

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
