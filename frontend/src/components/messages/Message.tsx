import React, { useCallback } from 'react'
import { Icon, MessageContainer, RelativeDate, UnreadIndicator } from './Message-style'
import { TMessage } from '../../helpers/types'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { useFetchMessages } from './MessagesPage'
import { collapseBody, expandBody } from '../../redux/messagesPageSlice'
import { logEvent, makeAuthorizedRequest } from '../../helpers/utils'
import { LogEvents } from '../../helpers/enums'
import { ButtonIcon, ButtonRight, ButtonRightContainer, HeaderLeft, HeaderRight, TaskHeaderContainer, Title } from '../task/TaskHeader-style'
import { EXPAND_ICON, MESSAGES_MODIFY_URL } from '../../constants'
import MessageBody from './MessageBody'
import { DateTime } from 'luxon'
import Tooltip from '../common/Tooltip'

interface MessageHeaderProps {
    message: TMessage
    isExpanded: boolean
}
const MessageHeader: React.FC<MessageHeaderProps> = (props: MessageHeaderProps) => {
    const dispatch = useAppDispatch()
    const fetchMessages = useFetchMessages()

    const hoverEffectEnabled = !!(props.message.body || props.message.deeplink)
    const onClick = useCallback(() => {
        if (hoverEffectEnabled) {
            if (props.isExpanded) {
                dispatch(collapseBody())
                logEvent(LogEvents.MESSAGE_COLLAPSED)
            } else {
                dispatch(expandBody(props.message.id))
                if (props.message.is_unread) {
                    read(props.message.id, fetchMessages)
                }
                logEvent(LogEvents.MESSAGE_EXPANDED)
            }
        }
    }, [hoverEffectEnabled, props.isExpanded])

    return (
        <TaskHeaderContainer showButtons={props.isExpanded} onClick={onClick}>
            <HeaderLeft>
                {props.message.is_unread &&
                    <UnreadIndicator />
                }
                <Icon src={props.message.source.logo} alt="icon"></Icon>
                <Title isExpanded={props.isExpanded} isEditable={false} defaultValue={props.message.title} />
            </HeaderLeft>
            <HeaderRight>
                {props.message.sent_at &&
                    <RelativeDate>{DateTime.fromISO(props.message.sent_at).toRelative()}</RelativeDate>
                }
                {
                    <ButtonRightContainer>
                        <ButtonRight onClick={(e) => {
                            e.stopPropagation()
                            dispatch(props.isExpanded ? collapseBody() : expandBody(props.message.id))
                        }}>
                            <Tooltip text={'Expand/Collapse'}>
                                <ButtonIcon src={EXPAND_ICON} alt="expand" />
                            </Tooltip>

                        </ButtonRight>
                    </ButtonRightContainer>
                }
            </HeaderRight >
        </TaskHeaderContainer >
    )
}

const read = async (id: string, fetchMessages: () => void) => {
    try {
        const response = await makeAuthorizedRequest({
            url: MESSAGES_MODIFY_URL + id + '/',
            method: 'PATCH',
            body: JSON.stringify({ is_unread: false }),
        })

        if (!response.ok) {
            throw new Error('PATCH /messages/modify Mark as Read failed: ' + response.text())
        }
        fetchMessages()
    } catch (e) {
        console.log({ e })
    }
}

interface MessageProps {
    message: TMessage
}
export default function Message(props: MessageProps): JSX.Element {
    const { message } = props
    const { isBodyExpanded } = useAppSelector((state) => ({
        isBodyExpanded: state.messages_page.messages.expanded_body === message.id,
    }))

    return (
        <MessageContainer isExpanded={isBodyExpanded}>
            <MessageHeader message={message} isExpanded={isBodyExpanded} />
            <MessageBody message={message} isExpanded={isBodyExpanded} />
        </MessageContainer>
    )
}
