import { EmailInput, EmailInputContainer, EmailComposeContainer, FullWidth, ButtonSpacer } from './EmailCompose-styles'
import React, { useCallback, useEffect, useState } from 'react'

import EmailRecipientsInput from './EmailRecipientsInput'
import { TEmail, TRecipients } from '../../../utils/types'
import TextArea from '../../atoms/TextArea'
import styled from 'styled-components'
import { useComposeMessage } from '../../../services/api-query-hooks'
import RoundedGeneralButton from '../../atoms/buttons/RoundedGeneralButton'
import { Colors } from '../../../styles'
import { EmailComposeType } from '../../../utils/enums'

const SubjectContainer = styled.div`
    ${EmailInputContainer}
`
const SubjectInput = styled.input`
    ${EmailInput}
`

interface EmailComposeProps {
    email: TEmail
    initialRecipients?: TRecipients
    emailComposeType: EmailComposeType
    sourceAccountId: string
    discardDraft: () => void
}
const EmailCompose = ({ email, sourceAccountId, discardDraft }: EmailComposeProps) => {
    const [recipients, setRecipients] = useState<TRecipients>(email.sender.email)
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

export default EmailCompose
