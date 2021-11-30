import { BodyDiv, BodyIframe, Deeplink, ExpandedBody, ReplyDiv, ReplyInputStyle } from './TaskBody-style'
import { MAX_TASK_BODY_HEIGHT, TASKS_URL } from '../../constants'
import React, { useEffect, useRef, useState } from 'react'
import { fetchTasks, makeAuthorizedRequest, useDeviceSize } from '../../helpers/utils'

import ContentEditable from 'react-contenteditable'
import GTButton from '../common/GTButton'
import { RootState } from '../../redux/store'
import { TTaskSource } from '../../helpers/types'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'

interface Props {
    body: string | null,
    task_id: string,
    deeplink: string | null,
    source: TTaskSource,
    sender: string | null,
}

interface BodyHTMLProps {
    body: string,
    task_id: string,
    isBodyExpanded: boolean,
}

interface ReplyProps {
    task_id: string,
    sender: string | null,
}


// no body: no body
// has_body, expanded_body != task_id: no body
// has_body, expanded_body == task_id: show body
const TaskBody: React.FC<Props> = ({ body, task_id, sender, deeplink, source }: Props) => {
    const { isBodyExpanded } = useSelector((state: RootState) => ({
        isBodyExpanded: state.tasks_page.expanded_body === task_id,
    }))


    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [iframeHeight, setIframeHeight] = useState(0)
    const [scrollPosition, setScrollPosition] = useState(100)
    // const scrollPos = useRef(0)

    useDeviceSize()
    useEffect(() => {
        if (body && iframeRef.current) {
            resizeIframe(iframeRef?.current, setIframeHeight, isBodyExpanded, scrollPosition)
        }
    }, [isBodyExpanded, body])

    const onScroll = () => {
        setScrollPosition(iframeRef?.current?.contentWindow?.window.scrollY ?? 0)
    }

    useEffect(() => {
        if (body && iframeRef.current) {
            if (isBodyExpanded && iframeRef?.current?.contentWindow) {
                iframeRef.current.contentWindow.window.addEventListener('scroll', onScroll)
                return () => {
                    if (isBodyExpanded && iframeRef?.current?.contentWindow) {
                        iframeRef.current.contentWindow.window.removeEventListener('scroll', onScroll)
                    }
                }
            }
        }
    }, [isBodyExpanded, body])


    return (
        <div>
            {Boolean(body || deeplink) && (
                <ExpandedBody isExpanded={isBodyExpanded}>
                    {body && (
                        <BodyDiv>
                            {/* <BodyHTML body={body} task_id={task_id} isBodyExpanded={isBodyExpanded} /> */}
                            {scrollPosition}
                            <BodyIframe
                                ref={iframeRef}
                                iframeHeight={iframeHeight}
                                title={'Body for task: ' + task_id}
                                srcDoc={body}
                            />
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

function resizeIframe(
    iframe: HTMLIFrameElement | null,
    setIframeHeight: React.Dispatch<React.SetStateAction<number>>,
    isVisible: boolean,
    scrollPosition = 0,
) {
    if (isVisible && iframe?.contentWindow?.document != null) {
        let height = Math.min(
            iframe.contentWindow.document.querySelector('html')?.offsetHeight
            ?? iframe.contentWindow.document.body.offsetHeight,
            MAX_TASK_BODY_HEIGHT
        )
        height += 5
        iframe.style.visibility = 'visible'
        iframe.contentWindow.scrollTo(0, scrollPosition)
        setIframeHeight(height)
        return height
    }
    return 0
}

// const BodyHTML: React.FC<BodyHTMLProps> = ({ body, task_id, isBodyExpanded }: BodyHTMLProps) => {
//     const iframeRef = useRef<HTMLIFrameElement>(null)
//     const [iframeHeight, setIframeHeight] = useState(0)
//     const [scrollPosition, setScrollPosition] = useState(50)
//     // const scrollPos = useRef(0)

//     useDeviceSize()
//     useEffect(() => {
//         resizeIframe(iframeRef?.current, setIframeHeight, isBodyExpanded, scrollPosition)
//     }, [isBodyExpanded, body])

//     const onScroll = () => {
//         setScrollPosition(iframeRef?.current?.contentWindow?.window.scrollY ?? 0)
//     }

//     useEffect(() => {
//         if (iframeRef?.current?.contentWindow) {
//             iframeRef.current.contentWindow.window.addEventListener('scroll', onScroll)
//             return () => {
//                 if (iframeRef?.current?.contentWindow) {
//                     iframeRef.current.contentWindow.window.removeEventListener('scroll', onScroll)
//                 }
//             }
//         }
//     }, [])

//     return <>
//         {scrollPosition}
// <BodyIframe
//     ref={iframeRef}
//     iframeHeight={iframeHeight}
//     title={'Body for task: ' + task_id}
//     srcDoc={body}
// /></>
// }
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
