import React, { useState } from 'react'

import { EmailReplyContainer } from './EmailReplyStyles'
import NoStyleInput from '../../atoms/NoStyleInput'
import TextArea from '../../atoms/TextArea'

interface EmailReplyProps {
    replyTo: string
    subject: string
}
const EmailReply = () => {
    const [body, setBody] = useState('')
    return (
        <EmailReplyContainer>
            <div>
                <NoStyleInput placeholder="Recipients" value="" />
            </div>
            <div>
                <NoStyleInput placeholder="Subject" value="Re: email" />
            </div>
            <div>
                <TextArea
                    placeholder="Body"
                    setValue={(value) => {
                        setBody(value)
                    }}
                    value={body}
                />
            </div>
        </EmailReplyContainer>
    )
}

export default EmailReply
