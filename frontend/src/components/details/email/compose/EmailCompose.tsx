import {
    BodyContainer,
    ButtonsContainer,
    ComposeSelectorButtonContainer,
    EmailComposeContainer,
    EmailFieldContainer,
    EmailFieldInput,
    FlexExpand,
} from './styles'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { TEmail, TEmailComposeState, TRecipients } from '../../../../utils/types'
import { attachSubjectPrefix, getInitialRecipients, stripSubjectPrefix } from './utils'
import toast, { ToastId, dismissToast } from '../../../../utils/toast'

import { Colors } from '../../../../styles'
import { Divider } from '../../../atoms/SectionDivider'
import { EMAIL_UNDO_TIMEOUT } from '../../../../constants'
import { EmailComposeType } from '../../../../utils/enums'
import EmailComposeTypeSelector from './ComposeTypeSelector'
import EmailRecipientsForm from './RecipientsForm'
import EmailWithQuote from './EmailWithQuote'
import RoundedGeneralButton from '../../../atoms/buttons/RoundedGeneralButton'
import TextArea from '../../../atoms/TextArea'
import { renderToString } from 'react-dom/server'
import { useComposeMessage } from '../../../../services/api-query-hooks'

interface EmailComposeProps {
    email: TEmail
    composeType: EmailComposeType
    isPending: boolean
    sourceAccountId: string
    setThreadComposeState: React.Dispatch<React.SetStateAction<TEmailComposeState>>
}
const EmailCompose = (props: EmailComposeProps) => {
    const [recipients, setRecipients] = useState<TRecipients>(
        getInitialRecipients(props.email, props.composeType, props.sourceAccountId)
    )
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')

    const sentToastRef = useRef<ToastId>()
    const toFieldRef = useRef<HTMLInputElement>(null)
    const bodyFieldRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (props.composeType === EmailComposeType.REPLY || props.composeType === EmailComposeType.REPLY_ALL) {
            bodyFieldRef?.current?.focus()
        } else {
            toFieldRef?.current?.focus()
        }
    }, [props.email.message_id, props.composeType])

    useEffect(() => {
        setBody('')
    }, [props.email.message_id])

    useEffect(() => {
        setRecipients(getInitialRecipients(props.email, props.composeType, props.sourceAccountId))
        setSubject(attachSubjectPrefix(stripSubjectPrefix(props.email.subject), props.composeType))
    }, [props.email.message_id, props.composeType])

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
                body: renderToString(
                    <EmailWithQuote bodyHTML={body} quotedEmail={props.email} composeType={props.composeType} />
                ),
                recipients,
                source_id: 'gmail',
                source_account_id: props.sourceAccountId,
            })
            onClose()
        },
        [props.email, props.sourceAccountId, props.setThreadComposeState, props.composeType, mutate]
    )

    const startSendEmail = useCallback(
        (recipients: TRecipients, subject: string, body: string) => {
            const timeout = setTimeout(() => {
                sendEmail(recipients, subject, body.replace(/\n/g, '<br/>'))
                props.setThreadComposeState({
                    emailComposeType: null,
                    emailId: null,
                })
            }, EMAIL_UNDO_TIMEOUT * 1000)
            sentToastRef.current = toast(
                {
                    message: 'Your email was sent.',
                    rightAction: {
                        label: 'Undo',
                        onClick: () => {
                            clearTimeout(timeout)
                            dismissToast(sentToastRef.current)
                            props.setThreadComposeState((composeState) => ({
                                ...composeState,
                                isPending: false,
                            }))
                        },
                    },
                },
                {
                    autoClose: EMAIL_UNDO_TIMEOUT * 1000,
                    pauseOnFocusLoss: false,
                }
            )
            props.setThreadComposeState((composeState) => ({
                ...composeState,
                isPending: true,
            }))
        },
        [sendEmail]
    )

    if (props.isPending) {
        return null
    }

    return (
        <EmailComposeContainer>
            <ComposeSelectorButtonContainer>
                <EmailComposeTypeSelector email={props.email} setThreadComposeState={props.setThreadComposeState} />
            </ComposeSelectorButtonContainer>
            <FlexExpand ref={(node) => node?.scrollIntoView()}>
                <EmailRecipientsForm ref={toFieldRef} recipients={recipients} setRecipients={setRecipients} />
                <EmailFieldContainer>
                    <EmailFieldInput
                        placeholder="Subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        onKeyDown={(e) => {
                            e.stopPropagation()
                        }}
                    />
                </EmailFieldContainer>
                <Divider color={Colors.gray._200} />
                <BodyContainer>
                    <TextArea
                        ref={bodyFieldRef}
                        placeholder="Body"
                        setValue={(value) => {
                            setBody(value)
                        }}
                        value={body}
                    />
                </BodyContainer>
                <ButtonsContainer>
                    <RoundedGeneralButton
                        onClick={() => startSendEmail(recipients, subject, body)}
                        value="Send"
                        color={Colors.purple._1}
                        disabled={recipients.to.length === 0}
                    />
                    <RoundedGeneralButton onClick={onClose} value="Cancel" textStyle="dark" />
                    {isLoading && 'Sending...'}
                </ButtonsContainer>
            </FlexExpand>
        </EmailComposeContainer>
    )
}

export default EmailCompose
