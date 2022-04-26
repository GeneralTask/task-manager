import { EmailInput, EmailInputContainer, EmailComposeContainer, FullWidth, ButtonSpacer } from './EmailCompose-styles'
import React, { useCallback, useEffect, useState } from 'react'

import EmailRecipientsInput from './EmailRecipientsInput'
import { TEmail } from '../../../utils/types'
import TextArea from '../../atoms/TextArea'
import styled from 'styled-components'
import { useComposeMessage } from '../../../services/api-query-hooks'
import RoundedGeneralButton from '../../atoms/buttons/RoundedGeneralButton'
import { Colors } from '../../../styles'

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

    useEffect(() => {
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
        <EmailComposeContainer>
            <EmailRecipientsInput sender={email.sender.email} />
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
            <FullWidth>
                <RoundedGeneralButton
                    onPress={() => sendEmail(replyTo, subject, body)}
                    value="Send"
                    color={Colors.purple._1}
                />
                <ButtonSpacer />
                <RoundedGeneralButton onPress={discardDraft} value="Cancel" textStyle="dark" />
                {isLoading ? 'Sending...' : ''}
            </FullWidth>
        </EmailComposeContainer>
    )
}

export default EmailReply
