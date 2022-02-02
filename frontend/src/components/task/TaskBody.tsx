import { BORDER_PRIMARY, TEXT_BLACK, TEXT_GRAY } from '../../helpers/styles'
import { TASKS_MODIFY_URL, TASKS_URL } from '../../constants'
import React, { useRef, useState } from 'react'
import { logEvent, makeAuthorizedRequest } from '../../helpers/utils'
import { useFetchTasks } from './TasksPage'
import ContentEditable from 'react-contenteditable'
import GTButton from '../common/GTButton'
import ReactDOMServer from 'react-dom/server'
import { TTask } from '../../helpers/types'
import { toast } from 'react-toastify'
import {
    TaskBodyDiv,
    Deeplink,
    ReplyDiv,
    ExpandedBody,
    EmailMessage,
    ReplyInputStyle,
    EmailViewDiv,
    EmailSubjectHeader,
    BodyContentEditable,
} from './TaskBody-style'
import sanitizeHtml from 'sanitize-html'
import { LogEvents } from '../../helpers/enums'

interface Props {
    task: TTask
    isExpanded: boolean
}

// no body: no body
// has_body, expanded_body != task_id: no body
// has_body, expanded_body == task_id: show body
const TaskBody: React.FC<Props> = React.memo(({ task, isExpanded }: Props) => {
    const { body, id, sender, deeplink, source, sent_at } = task
    const editable = task.source.name === 'General Task'
    const hasBody = body !== '<body></body>'
    return (
        <ExpandedBody isExpanded={isExpanded}>
            {(
                <TaskBodyDiv>
                    {source.is_replyable ?
                        <>
                            <EmailBody body={body} task_id={id} />
                            <Reply task_id={id} sender={sender} body={body} sent_at={sent_at} />
                        </> : <>
                            {(hasBody || editable) &&
                                <Body body={body} task_id={id} editable={editable} />
                            }
                        </>
                    }
                </TaskBodyDiv>
            )}
            {deeplink && (
                <Deeplink>
                    <p>
                        See more in{' '}
                        <a
                            href={deeplink}
                            target="_blank"
                            onClick={() => {
                                logEvent(LogEvents.TASK_DEEPLINK_CLICKED)
                            }}
                        >
                            {source.name}
                        </a>
                    </p>
                </Deeplink>
            )}
        </ExpandedBody>
    )
})

interface EmailViewProps {
    body: string
    task_id: string
}

const EmailBody: React.FC<EmailViewProps> = (props: EmailViewProps) => {
    const whitelistedHTMLAttributes: sanitizeHtml.IOptions = {
        allowedAttributes: false,
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'a', 'center']),
    }
    const transformTags = {
        a: sanitizeHtml.simpleTransform('a', { target: '_blank' }, true),
    }
    const cleanHTML = sanitizeHtml(props.body, {
        ...whitelistedHTMLAttributes,
        transformTags,
    })
    return (
        <EmailViewDiv>
            <EmailMessage>
                <EmailSubjectHeader>Subject: {'{email subject}'} </EmailSubjectHeader>
                <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />
            </EmailMessage>
        </EmailViewDiv>
    )
}

interface BodyProps {
    body: string
    task_id: string
    editable: boolean
}

const Body: React.FC<BodyProps> = (props: BodyProps) => {
    const body = useRef(props.body)

    const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            e.currentTarget.blur()
        }
    }

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        e.target.scrollLeft = 0
        makeAuthorizedRequest({
            url: TASKS_MODIFY_URL + props.task_id + '/',
            method: 'PATCH',
            body: JSON.stringify({ body: body.current }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('PATCH /tasks/modify failed: ' + response.text())
                }
            })
            .catch(e => {
                console.log({ e })
            })
    }

    return (
        <BodyContentEditable
            html={props.body}
            disabled={!props.editable}
            onKeyPress={handleKeyPress}
            onChange={(e) => body.current = e.target.value}
            onBlur={handleBlur}
            tagName='div'
            onKeyDown={(e) => e.stopPropagation()}
            placeholder_text='Add task details...'
        />
    )
}
interface EmailQuoteProps {
    sender: string | null
    body: string
    sent_at: string | null
}

function EmailQuote({ sender, body, sent_at }: EmailQuoteProps): JSX.Element {
    const newMessageStyles = {
        color: TEXT_BLACK,
    }
    const emailBlockStyles = {
        color: `${TEXT_GRAY}`,
        fontSize: 'small',
    }
    const emailQuoteStyles = {
        margin: '0px 0px 0px 0.8ex',
        borderLeft: `1px solid ${BORDER_PRIMARY}`,
        paddingLeft: '1ex',
    }

    const whitelistedHTMLAttributes: sanitizeHtml.IOptions = {
        allowedAttributes: false,
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'center']),
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
            <div style={newMessageStyles}>
                <br />
                <br />
                <br />
            </div>
            <div style={emailBlockStyles}>
                {sender && sent_at && <div>{emailSenderQuote}</div>}
                <div style={emailQuoteStyles}>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(body, whitelistedHTMLAttributes),
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

interface ReplyProps {
    task_id: string
    sender: string | null
    body: string
    sent_at: string | null
}

const Reply: React.FC<ReplyProps> = ({ task_id, sender, body, sent_at }: ReplyProps) => {
    const fetchTasks = useFetchTasks()
    const [text, setText] = useState(
        ReactDOMServer.renderToStaticMarkup(<EmailQuote sender={sender} body={body} sent_at={sent_at} />)
    )

    return (
        <ReplyDiv>
            <ContentEditable
                className="reply-input"
                html={text}
                style={ReplyInputStyle}
                onChange={(e) => setText(e.target.value)}
                // to prevent inputs from triggering keyboard shortcuts
                onKeyDown={e => e.stopPropagation()}
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
                    } else {
                        toast.error(`There was an error replying to ${sender ?? 'email'}`)
                    }
                }}
            >
                Reply
            </GTButton>
        </ReplyDiv>
    )
}

export default TaskBody
