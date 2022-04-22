import { EmailReplyContainer } from './EmailReplyStyles'
import NoStyleInput from '../../atoms/NoStyleInput'
import React from 'react'
import TextArea from '../../atoms/TextArea'

const EmailReply = () => {
    return (
        <EmailReplyContainer>
            <div>
                <NoStyleInput placeholder="Recipients" value="" />
            </div>
            <div>
                <NoStyleInput placeholder="Subject" value="Re: email" />
            </div>
            <div>
                <TextArea placeholder="Body" setValue={() => {}} />
            </div>
        </EmailReplyContainer>
    )
}

export default EmailReply
