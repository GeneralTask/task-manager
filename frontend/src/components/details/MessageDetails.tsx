import DetailsTemplate, { Title } from './DetailsTemplate'
import React, { useEffect, useState } from 'react'

import EmailSenderDetails from '../molecules/EmailSenderDetails'
import { Icon } from '../atoms/Icon'
import ReactTooltip from 'react-tooltip'
import { TMessage } from '../../utils/types'
import TaskHTMLBody from '../atoms/TaskHTMLBody'
import { logos } from '../../styles/images'

interface MessageDetailsProps {
    message: TMessage
}
const MessageDetails = (props: MessageDetailsProps) => {
    const [message, setMessage] = useState<TMessage>(props.message)

    useEffect(() => {
        ReactTooltip.rebuild()
    }, [])

    // Update the state when the message changes
    useEffect(() => {
        setMessage(props.message)
    }, [props.message])

    return (
        <DetailsTemplate
            top={<Icon source={logos[message.source.logo_v2]} size="small" />}
            title={<Title>{message.title}</Title>}
            senderDetails={<EmailSenderDetails sender={message.sender_v2} recipients={message.recipients} />}
            body={<TaskHTMLBody dirtyHTML={message.body} />}
        />
    )
}

export default MessageDetails
