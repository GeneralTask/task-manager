import DetailsTemplate, { Title } from './DetailsTemplate'
import React from 'react'
import EmailSenderDetails from '../molecules/EmailSenderDetails'
import { TMessage } from '../../utils/types'
import { logos } from '../../styles/images'
import { Icon, SanitizedHTML } from '@atoms'

interface MessageDetailsProps {
    message: TMessage
}
const MessageDetails = ({ message }: MessageDetailsProps) => {
    return (
        <DetailsTemplate
            top={<Icon source={logos[message.source.logo_v2]} size="small" />}
            title={<Title>{message.title}</Title>}
            subtitle={<EmailSenderDetails sender={message.sender_v2} recipients={message.recipients} />}
            body={<SanitizedHTML dirtyHTML={message.body} />}
        />
    )
}

export default MessageDetails
