import { EmailReplyContainer, FullWidth } from './EmailReplyStyles'
import React, { useCallback, useState } from 'react'

import { Icon } from '../../atoms/Icon'
import { Images } from '../../../styles'
import NoStyleButton from '../../atoms/buttons/NoStyleButton'
import NoStyleInput from '../../atoms/NoStyleInput'
import { TEmail } from '../../../utils/types'
import TextArea from '../../atoms/TextArea'
import { useComposeMessage } from '../../../services/api-query-hooks'

interface EmailReplyProps {
    email: TEmail
    sourceAccountId: string
    discardDraft: () => void
}
const EmailReply = ({ email, sourceAccountId, discardDraft }: EmailReplyProps) => {
    const [replyTo, setReplyTo] = useState(email.sender.email)
    const [subject, setSubject] = useState((email.subject.slice(0, 3) === 'Re:' ? '' : 'Re: ') + email.subject)
    const [body, setBody] = useState('')

    const { mutate, isLoading } = useComposeMessage()

    const sendEmail = useCallback(
        (to: string, subject, body) => {
            mutate({
                message_id: email.message_id,
                subject,
                body,
                recipients: {
                    to: [
                        {
                            email: to,
                            name: '',
                        },
                    ],
                    cc: [],
                    bcc: [],
                },
                source_id: 'gmail',
                source_account_id: sourceAccountId,
            })
        },
        [email, sourceAccountId, mutate]
    )

    return (
        <EmailReplyContainer>
            <FullWidth>
                {/* <FlexGrow> */}
                <NoStyleInput placeholder="To:" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} />
                {/* </FlexGrow> */}
                <NoStyleButton onClick={discardDraft}>
                    <Icon size="small" source={Images.icons.trash} />
                </NoStyleButton>
            </FullWidth>
            <FullWidth>
                <NoStyleInput placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </FullWidth>
            <FullWidth>
                <TextArea
                    placeholder="Body"
                    setValue={(value) => {
                        setBody(value)
                    }}
                    value={body}
                />
            </FullWidth>
            <FullWidth style={{ justifyContent: 'end' }}>
                {isLoading ? 'Sending...' : ''}
                <button onClick={() => sendEmail(replyTo, subject, body)}>Send</button>
            </FullWidth>
        </EmailReplyContainer>
    )
}

export default EmailReply
