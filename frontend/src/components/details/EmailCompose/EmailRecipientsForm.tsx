import {
    AddEmailRecipientsButton,
    AddEmailRecipientsContainer,
    EmailRecipientsContainer,
    EmailTag,
    FlexExpand,
} from './EmailCompose-styles'
import { Colors, Images } from '../../../styles'
import React, { useCallback, useMemo, useState } from 'react'

import { Divider } from '../../atoms/SectionDivider'
import { Icon } from '../../atoms/Icon'
import MultiEmailInput from './MultiEmailInput'
import NoStyleButton from '../../atoms/buttons/NoStyleButton'
import { ReactMultiEmail } from 'react-multi-email'
import { TRecipients } from '../../../utils/types'
import { emailsToRecipients } from './emailComposeUtils'

// Keyboard shortcuts used in react-multi-email/ReactMultiEmail.tsx
const REACT_MULTI_EMAIL_KB_SHORTCUT = ['Enter', 'Tab', 'Backspace']

interface EmailRecipientsInputProps {
    recipients: TRecipients
    setRecipients: React.Dispatch<React.SetStateAction<TRecipients>>
}

const EmailRecipientsInput = ({ recipients, setRecipients }: EmailRecipientsInputProps) => {
    // using memo here so that the recipients inputs will not clear on re-render (such as when messages are refetched)
    const toEmails = useMemo(() => recipients.to.map((r) => r.email), [recipients.to])
    const ccEmails = useMemo(() => recipients.cc.map((r) => r.email), [recipients.cc])
    const bccEmails = useMemo(() => recipients.bcc.map((r) => r.email), [recipients.bcc])

    const [showCc, setShowCc] = useState(recipients.cc.length > 0)
    const [showBcc, setShowBcc] = useState(recipients.bcc.length > 0)

    const onToChange = useCallback(
        (newEmails: string[]) => setRecipients((recipients) => ({ ...recipients, to: emailsToRecipients(newEmails) })),
        []
    )
    const onCcChange = useCallback(
        (newEmails: string[]) => setRecipients((recipients) => ({ ...recipients, cc: emailsToRecipients(newEmails) })),
        []
    )
    const onBccChange = useCallback(
        (newEmails: string[]) => setRecipients((recipients) => ({ ...recipients, bcc: emailsToRecipients(newEmails) })),
        []
    )

    const getLabel = useCallback((email: string, index: number, removeEmail: (index: number) => void) => {
        return (
            <EmailTag key={email}>
                {email}
                <NoStyleButton data-tag-handle onClick={() => removeEmail(index)}>
                    <Icon size="xSmall" source={Images.icons.x} />
                </NoStyleButton>
            </EmailTag>
        )
    }, [])

    // blocks all keys from propogating except those used in react-multi-email
    const enableBuiltInKBShortcuts = useCallback((node: HTMLDivElement) => {
        if (node) {
            node.addEventListener('keydown', (e) => {
                if (!REACT_MULTI_EMAIL_KB_SHORTCUT.includes(e.code)) {
                    e.stopPropagation()
                }
            })
        }
    }, [])

    return (
        <EmailRecipientsContainer ref={enableBuiltInKBShortcuts}>
            <FlexExpand>
                <ReactMultiEmail emails={toEmails} onChange={onToChange} placeholder="To:" getLabel={getLabel} />
            </FlexExpand>
            {(!showCc || !showBcc) && (
                <AddEmailRecipientsContainer>
                    {!showCc && <AddEmailRecipientsButton onClick={() => setShowCc(true)}>Cc</AddEmailRecipientsButton>}
                    {!showBcc && (
                        <AddEmailRecipientsButton onClick={() => setShowBcc(true)}>Bcc</AddEmailRecipientsButton>
                    )}
                </AddEmailRecipientsContainer>
            )}
            <Divider color={Colors.gray._200} />

            <FlexExpand>
                <MultiEmailInput recipients={recipients.to} />
            </FlexExpand>
            <Divider color={Colors.gray._200} />

            {showCc && (
                <>
                    <FlexExpand>
                        <ReactMultiEmail
                            emails={ccEmails}
                            onChange={onCcChange}
                            placeholder="Cc:"
                            getLabel={getLabel}
                        />
                    </FlexExpand>
                    <Divider color={Colors.gray._200} />
                </>
            )}
            {showBcc && (
                <>
                    <FlexExpand>
                        <ReactMultiEmail
                            emails={bccEmails}
                            onChange={onBccChange}
                            placeholder="Bcc:"
                            getLabel={getLabel}
                        />
                    </FlexExpand>
                    <Divider color={Colors.gray._200} />
                </>
            )}
        </EmailRecipientsContainer>
    )
}

export default EmailRecipientsInput
