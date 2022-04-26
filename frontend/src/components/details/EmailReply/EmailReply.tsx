import { EmailInput, EmailInputContainer, EmailReplyContainer, FlexGrow, FullWidth } from './EmailReplyStyles'
import React, { useCallback, useLayoutEffect, useState } from 'react'

import EmailRecipientsInput from './EmailRecipientsInput'
import { Icon } from '../../atoms/Icon'
import { Images } from '../../../styles'
import NoStyleButton from '../../atoms/buttons/NoStyleButton'
import { TEmail } from '../../../utils/types'
import TextArea from '../../atoms/TextArea'
import styled from 'styled-components'
import { useComposeMessage } from '../../../services/api-query-hooks'

const SubjectContainer = styled.div`
    ${EmailInputContainer}
`
const SubjectInput = styled.input`
    ${EmailInput}
`

interface EmailReplyProps {
    email: TEmail
    sourceAccountId: string
    discardDraft: () => void
}
const EmailReply = ({ email, sourceAccountId, discardDraft }: EmailReplyProps) => {
    const [replyTo, setReplyTo] = useState(email.sender.email)
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')

    useLayoutEffect(() => {
        setReplyTo(email.sender.email)
        setSubject((email.subject.slice(0, 3) === 'Re:' ? '' : 'Re: ') + email.subject)
        setBody('')
    }, [email])

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
                <FlexGrow>
                    {/* <NoStyleInput placeholder="To:" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} /> */}
                    <EmailRecipientsInput />
                </FlexGrow>
                <NoStyleButton onClick={discardDraft}>
                    <Icon size="small" source={Images.icons.trash} />
                </NoStyleButton>
            </FullWidth>
            <SubjectContainer>
                <SubjectInput
                    className="email-header"
                    placeholder="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                />
            </SubjectContainer>
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
