import {
    BodyContainer,
    ButtonsContainer,
    EmailComposeContainer,
    EmailInput,
    EmailInputContainer,
} from './EmailCompose-styles'
import React, { useCallback, useEffect, useState } from 'react'
import { TEmail, TEmailComposeState, TRecipients } from '../../../utils/types'
import { attachSubjectPrefix, getInitialRecipients, stripSubjectPrefix } from './emailComposeUtils'

import { Colors } from '../../../styles'
import { Divider } from '../../atoms/SectionDivider'
import { EMAIL_UNDO_TIMEOUT } from '../../../constants'
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
    composeType: EmailComposeType
    sourceAccountId: string
    setThreadComposeState: (state: TEmailComposeState) => void
}
const EmailCompose = (props: EmailComposeProps) => {
    const [recipients, setRecipients] = useState<TRecipients>(
        getInitialRecipients(props.email, props.composeType, props.sourceAccountId)
    )
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')

    useEffect(() => {
        setRecipients(getInitialRecipients(props.email, props.composeType, props.sourceAccountId))
        setSubject(attachSubjectPrefix(stripSubjectPrefix(props.email.subject), props.composeType))
        setBody('')
    }, [props.email.message_id])

    const { mutate, isLoading } = useComposeMessage()

    const onClose = () => props.setThreadComposeState({ emailComposeType: null, emailId: null })

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
            onClose()
        },
        [props.email, props.sourceAccountId, mutate, props.setThreadComposeState]
    )

    const startSendEmail = (recipients: TRecipients, subject: string, body: string) => {
        const timeout = setTimeout(() => {
            sendEmail(recipients, subject, body)
            props.setThreadComposeState({
                emailComposeType: null,
                emailId: null,
            })
        }, EMAIL_UNDO_TIMEOUT * 1000)
        // props.setThreadComposeState((composeState) => ({
        //     ...composeState,
        //     undoTimeout: timeout,
        // }))
    }

    // if (props.composeType === EmailComposeType.PENDING) {
    //     return null
    // }

    return (
        <EmailComposeContainer ref={(node) => node?.scrollIntoView()}>
            <EmailRecipientsInput recipients={recipients} setRecipients={setRecipients} />
            <SubjectContainer>
                <SubjectInput
                    className="email-header"
                    placeholder="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                />
            </SubjectContainer>
            <Divider color={Colors.gray._200} />
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
                    onPress={() => startSendEmail(recipients, subject, body)}
                    value="Send"
                    color={Colors.purple._1}
                    disabled={recipients.to.length === 0}
                />
                <RoundedGeneralButton onPress={onClose} value="Cancel" textStyle="dark" />
                {isLoading && 'Sending...'}
            </ButtonsContainer>
        </EmailComposeContainer>
    )
}

export default EmailCompose
