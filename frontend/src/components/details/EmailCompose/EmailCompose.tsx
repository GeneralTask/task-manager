import { ButtonSpacer, EmailComposeContainer, EmailInput, EmailInputContainer, FullWidth } from './EmailCompose-styles'
import React, { useCallback, useEffect, useState } from 'react'
import { TEmail, TRecipients } from '../../../utils/types'

import { Colors } from '../../../styles'
import { EmailComposeType } from '../../../utils/enums'
import EmailRecipientsInput from './EmailRecipientsInput'
import RoundedGeneralButton from '../../atoms/buttons/RoundedGeneralButton'
import TextArea from '../../atoms/TextArea'
import styled from 'styled-components'
import { useComposeMessage } from '../../../services/api-query-hooks'

const SubjectContainer = styled.div`
    ${EmailInputContainer}
`
const SubjectInput = styled.input`
    ${EmailInput}
`

interface EmailComposeProps {
    email: TEmail
    initialRecipients?: TRecipients
    composeType: EmailComposeType
    sourceAccountId: string
    discardDraft: () => void
}
const EmailCompose = (props: EmailComposeProps) => {
    const [recipients, _setRecipients] = useState<TRecipients>(
        props.initialRecipients ?? {
            to: [],
            cc: [],
            bcc: [],
        }
    )
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')

    useEffect(() => {
        // setReplyTo(email.sender.email)
        setSubject((props.email.subject.slice(0, 3) === 'Re:' ? '' : 'Re: ') + props.email.subject)
        setBody('')
    }, [props.email])

    const { mutate, isLoading } = useComposeMessage()

    const sendEmail = useCallback(
        (recipients: TRecipients, subject: string, body: string) => {
            mutate({
                message_id: props.email.message_id,
                subject,
                body,
                recipients,
                source_id: 'gmail',
                source_account_id: props.sourceAccountId,
            })
        },
        [props.email, props.sourceAccountId, mutate]
    )

    return (
        <EmailComposeContainer>
            <EmailRecipientsInput sender={props.email.sender.email} />
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
                    onPress={() => sendEmail(recipients, subject, body)}
                    value="Send"
                    color={Colors.purple._1}
                />
                <ButtonSpacer />
                <RoundedGeneralButton onPress={props.discardDraft} value="Cancel" textStyle="dark" />
                {isLoading ? 'Sending...' : ''}
            </FullWidth>
        </EmailComposeContainer>
    )
}

export default EmailCompose
