import React, { useCallback } from 'react'
import { Icon, MessageContainer, RelativeDate, UnreadIndicator } from './Message-style'
import { TMessage } from '../../helpers/types'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { useGetMessages } from './MessagesPage'
import { collapseBody, expandBody } from '../../redux/messagesPageSlice'
import { logEvent, makeAuthorizedRequest, useClickOutside } from '../../helpers/utils'
import { LogEvents } from '../../helpers/enums'
import {
    ButtonIcon,
    ButtonRight,
    ButtonRightContainer,
    HeaderLeft,
    HeaderRight,
    TaskHeaderContainer,
} from '../task/header/Header-style'
import { CHECK_SQUARE_OFFSET, EXPAND_ICON, MESSAGES_MODIFY_URL } from '../../constants'
import MessageBody from './MessageBody'
import { DateTime } from 'luxon'
import Tooltip from '../common/Tooltip'
import { MessageTitle } from '../common/Title'

interface MessageHeaderProps {
    message: TMessage
    isExpanded: boolean
}
const MessageHeader: React.FC<MessageHeaderProps> = (props: MessageHeaderProps) => {
    const dispatch = useAppDispatch()
    const getMessages = useGetMessages()

    const hoverEffectEnabled = !!(props.message.body || props.message.deeplink)
    const onClick = useCallback(() => {
        if (hoverEffectEnabled) {
            if (props.isExpanded) {
                dispatch(collapseBody())
                logEvent(LogEvents.MESSAGE_COLLAPSED)
            } else {
                dispatch(expandBody(props.message.id))
                if (props.message.is_unread) {
                    markAsRead(props.message.id, getMessages)
                }
                logEvent(LogEvents.MESSAGE_EXPANDED)
            }
        }
    }, [hoverEffectEnabled, props.isExpanded])

    return (
        <TaskHeaderContainer showButtons={props.isExpanded} onClick={onClick}>
            <HeaderLeft>
                {props.message.is_unread && <UnreadIndicator />}
                <Icon src={props.message.source.logo} alt="icon"></Icon>
                <MessageTitle message={props.message} isExpanded={props.isExpanded} />
            </HeaderLeft>
            <HeaderRight>
                {props.message.sent_at && (
                    <RelativeDate>{DateTime.fromISO(props.message.sent_at).toRelative()}</RelativeDate>
                )}
                {
                    <ButtonRightContainer>
                        <ButtonRight
                            onClick={(e) => {
                                e.stopPropagation()
                                markAsTask(props.message.id, fetchMessages)
                            }}
                        >
                            <Tooltip text={'Mark as Task'}>
                                <ButtonIcon src={CHECK_SQUARE_OFFSET} alt="expand" />
                            </Tooltip>
                        </ButtonRight>
                    </ButtonRightContainer>
                }
                {
                    <ButtonRightContainer>
                        <ButtonRight
                            onClick={(e) => {
                                e.stopPropagation()
                                dispatch(props.isExpanded ? collapseBody() : expandBody(props.message.id))
                            }}
                        >
                            <Tooltip text={'Expand/Collapse'}>
                                <ButtonIcon src={EXPAND_ICON} alt="expand" />
                            </Tooltip>
                        </ButtonRight>
                    </ButtonRightContainer>
                }
            </HeaderRight>
        </TaskHeaderContainer>
    )
}

const markAsTask = async (id: string, getMessages: () => void) => {
    try {
        const response = await makeAuthorizedRequest({
            url: MESSAGES_MODIFY_URL + id + '/',
            method: 'PATCH',
            body: JSON.stringify({ is_task: true }),
        })

        if (!response.ok) {
            throw new Error('PATCH /messages/modify Mark as Task failed: ' + response.text())
        }
        getMessages()
    } catch (e) {
        console.log({ e })
    }
}

const markAsRead = async (id: string, getMessages: () => void) => {
    // TODO: Re-enable this when we start sending read messages to the client
    try {
        const response = await makeAuthorizedRequest({
            url: MESSAGES_MODIFY_URL + id + '/',
            method: 'PATCH',
            // body: JSON.stringify({ is_unread: false }),
        })

        if (!response.ok) {
            throw new Error('PATCH /messages/modify Mark as Read failed: ' + response.text())
        }
        getMessages()
    } catch (e) {
        console.log({ e })
    }
}

interface MessageProps {
    message: TMessage
}
export default function Message(props: MessageProps): JSX.Element {
    const dispatch = useAppDispatch()
    const { message } = props
    const { isBodyExpanded } = useAppSelector((state) => ({
        isBodyExpanded: state.messages_page.messages.expanded_body === message.id,
    }))

    const containerRef = React.useRef<HTMLDivElement>(null)
    useClickOutside(containerRef, () => {
        isBodyExpanded && dispatch(collapseBody())
    })

    return (
        <MessageContainer isExpanded={isBodyExpanded} ref={containerRef}>
            <MessageHeader message={message} isExpanded={isBodyExpanded} />
            <MessageBody message={message} isExpanded={isBodyExpanded} />
        </MessageContainer>
    )
}
