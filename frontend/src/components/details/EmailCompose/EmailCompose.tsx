import {
    BodyContainer,
    ButtonsContainer,
    EmailComposeContainer,
    EmailFieldDivider,
    EmailInput,
    EmailInputContainer,
} from './EmailCompose-styles'
import React, { useCallback, useEffect, useState } from 'react'
import { TEmail, TRecipients } from '../../../utils/types'
import { attachSubjectPrefix, stripSubjectPrefix } from './emailComposeUtils'

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

const emptyRecipients: TRecipients = {
    to: [],
    cc: [],
    bcc: [],
}

interface EmailComposeProps {
    email: TEmail
    initialRecipients?: TRecipients
    composeType: EmailComposeType
    sourceAccountId: string
    onClose: () => void
}
const EmailCompose = (props: EmailComposeProps) => {
    const [recipients, setRecipients] = useState<TRecipients>(props.initialRecipients ?? emptyRecipients)
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')

    useEffect(() => {
        setRecipients(props.initialRecipients ?? emptyRecipients)
        setSubject(attachSubjectPrefix(stripSubjectPrefix(props.email.subject), props.composeType))
        setBody('')
    }, [props.email.message_id])

    const { mutate, isLoading } = useComposeMessage()

    const sendEmail = useCallback(
        (recipients: TRecipients, subject: string, body: string) => {
            // creates a new thread if the subject changes
            const messageId =
                stripSubjectPrefix(subject) === stripSubjectPrefix(props.email.subject)
                    ? props.email.message_id
                    : undefined
            mutate({
                message_id: messageId,
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
            <EmailRecipientsInput recipients={recipients} setRecipients={setRecipients} />
            <SubjectContainer>
                <SubjectInput
                    className="email-header"
                    placeholder="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                />
            </SubjectContainer>
            <EmailFieldDivider />
            <BodyContainer>
                <TextArea
                    placeholder="Body"
                    setValue={(value) => {
                        setBody(value)
                    }}
                    value={body}
                />
            </BodyContainer>
            <ButtonsContainer>
                <RoundedGeneralButton
                    onPress={() => sendEmail(recipients, subject, body)}
                    value="Send"
                    color={Colors.purple._1}
                    disabled={recipients.to.length === 0}
                />
                <RoundedGeneralButton onPress={props.onClose} value="Cancel" textStyle="dark" />
                {isLoading && 'Sending...'}
            </ButtonsContainer>
        </EmailComposeContainer>
    )
}

export default EmailCompose
