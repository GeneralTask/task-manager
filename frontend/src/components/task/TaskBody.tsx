import { BORDER_PRIMARY, TEXT_BLACK, TEXT_GRAY } from '../../helpers/styles'
import { TASKS_URL } from '../../constants'
import React, { useState } from 'react'
import { logEvent, makeAuthorizedRequest } from '../../helpers/utils'
import { useFetchTasks } from './TasksPage'
import ContentEditable from 'react-contenteditable'
import GTButton from '../common/GTButton'
import ReactDOMServer from 'react-dom/server'
import { TTask } from '../../helpers/types'
import { toast } from 'react-toastify'
import { TaskBodyDiv, Deeplink, ReplyDiv, ExpandedBody, EmailMessage, ReplyInputStyle, EmailViewDiv, EmailSubjectHeader } from './TaskBody-style'
import sanitizeHtml from 'sanitize-html'
import { LogEvents } from '../../helpers/enums'

interface Props {
    task: TTask,
    isExpanded: boolean,
}

// no body: no body
// has_body, expanded_body != task_id: no body
// has_body, expanded_body == task_id: show body
const TaskBody: React.FC<Props> = React.memo(({ task, isExpanded }: Props) => {
    const { body, id, sender, deeplink, source, sent_at } = task
    return (
        <div>
            {Boolean(body || deeplink) && (
                <ExpandedBody isExpanded={isExpanded}>
                    {body && (
                        <TaskBodyDiv>
                            <EmailBody body={body} task_id={id} />
                            {source.is_replyable && <Reply task_id={id} sender={sender} body={body} sent_at={sent_at} />}
                        </TaskBodyDiv>
                    )}
                    {deeplink && (
                        <Deeplink>
                            <p>
                                See more in <a href={deeplink} target="_blank" onClick={() => {
                                    logEvent(LogEvents.TASK_DEEPLINK_CLICKED)
                                }}>{source.name}</a>
                            </p>
                        </Deeplink>
                    )}
                </ExpandedBody>
            )}
        </div>
    )
})

interface EmailViewProps {
    body: string,
    task_id: string,
}

const EmailBody: React.FC<EmailViewProps> = (props: EmailViewProps) => {
    const whitelistedHTMLAttributes: sanitizeHtml.IOptions = {
        allowedAttributes: false,
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'a', 'center'])
    }
    const transformTags = { 'a': sanitizeHtml.simpleTransform('a', { target: '_blank' }, true) }
    const cleanHTML = sanitizeHtml(props.body, { ...whitelistedHTMLAttributes, transformTags })
    return (
        <EmailViewDiv>
            <EmailMessage>
                <EmailSubjectHeader>Subject: {'{email subject}'} </EmailSubjectHeader>
                <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />
            </EmailMessage>
        </EmailViewDiv>
    )
}

interface EmailQuoteProps {
    sender: string | null,
    body: string,
    sent_at: string | null,
}

function EmailQuote({ sender, body, sent_at }: EmailQuoteProps): JSX.Element {
    const newMessageStyles = {
        color: TEXT_BLACK
    }
    const emailBlockStyles = {
        color: `${TEXT_GRAY}`,
        fontSize: 'small',
    }
    const emailQuoteStyles = {
        margin: '0px 0px 0px 0.8ex',
        borderLeft: `1px solid ${BORDER_PRIMARY}`,
        paddingLeft: '1ex'
    }

    const whitelistedHTMLAttributes: sanitizeHtml.IOptions = {
        allowedAttributes: false,
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'center'])
    }
    const emailDate = new Date(sent_at || '')
    const month = emailDate.toLocaleString('default', { month: 'short' })
    const hours = emailDate.getHours()
    const minutes = emailDate.getMinutes()
    const date = emailDate.getDate()
    const year = emailDate.getFullYear()

    let timeString = ''
    if (hours > 12) timeString = `${hours - 12}:${minutes} PM`
    else timeString = `${hours}:${minutes} AM`

    const emailSenderQuote = `On ${month} ${date}, ${year} at ${timeString},
                ${sender} wrote:`

    return (
        <div>
            <div style={newMessageStyles} >
                <br />
                <br />
                <br />
            </div>
            <div style={emailBlockStyles}>
                {sender && sent_at && <div>{emailSenderQuote}</div>}
                <div style={emailQuoteStyles}>
                    <div
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(body, whitelistedHTMLAttributes) }}
                    />
                </div>
            </div >
        </div >
    )
}

interface ReplyProps {
    task_id: string,
    sender: string | null,
    body: string,
    sent_at: string | null,
}

const Reply: React.FC<ReplyProps> = ({ task_id, sender, body, sent_at }: ReplyProps) => {
    const fetchTasks = useFetchTasks()
    const [text, setText] = useState(ReactDOMServer.renderToStaticMarkup(<EmailQuote sender={sender} body={body} sent_at={sent_at} />))

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
            width="5.5em"
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
