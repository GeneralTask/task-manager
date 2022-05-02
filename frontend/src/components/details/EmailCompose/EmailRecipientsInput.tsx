import { EmailFieldDivider, EmailRecipientsContainer, EmailTag } from './EmailCompose-styles'
import React, { useCallback, useEffect, useState } from 'react'

import { Icon } from '../../atoms/Icon'
import { Images } from '../../../styles'
import NoStyleButton from '../../atoms/buttons/NoStyleButton'
import { ReactMultiEmail } from 'react-multi-email'
import { TRecipients } from '../../../utils/types'

// Keyboard shortcuts used in react-multi-email/ReactMultiEmail.tsx
const REACT_MULTI_EMAIL_KB_SHORTCUT = ['Enter', 'Tab', 'Backspace']

interface EmailRecipientsInputProps {
    recipients: TRecipients
    setRecipients: (recipients: TRecipients) => void
}

// CURRENTLY ONLY SUPPORTS "TO" RECIPIENTS - WILL ADD CC AND BCC SOON
const EmailRecipientsInput = ({ recipients, setRecipients }: EmailRecipientsInputProps) => {
    const [toEmails, setToEmails] = useState<string[]>(recipients.to.map((r) => r.email))
    const [ccEmails, setCcEmails] = useState<string[]>(recipients.cc.map((r) => r.email))
    const [bccEmails, setBccEmails] = useState<string[]>(recipients.bcc.map((r) => r.email))

    const [showCc, setShowCc] = useState(false)
    const [showBcc, setShowBcc] = useState(false)

    // need a separate state because ReactMultiEmail needs an array of strings, but recipients is an array of objects
    useEffect(() => {
        setRecipients({
            ...recipients,
            to: toEmails.map((email) => ({ email, name: '' })),
            cc: ccEmails.map((email) => ({ email, name: '' })),
            bcc: bccEmails.map((email) => ({ email, name: '' })),
        })
    }, [toEmails, ccEmails, bccEmails])

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

    const onToChange = useCallback((newEmails: string[]) => setToEmails(newEmails), [setToEmails])
    const onCcChange = useCallback((newEmails: string[]) => setCcEmails(newEmails), [setCcEmails])
    const onBccChange = useCallback((newEmails: string[]) => setBccEmails(newEmails), [setBccEmails])

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

    return (
        <EmailRecipientsContainer ref={enableBuiltInKBShortcuts}>
            <ReactMultiEmail emails={toEmails} onChange={onToChange} placeholder="To:" getLabel={getLabel} />
            <div>
                {!showCc && <button onClick={() => setShowCc(true)}>Cc</button>}
                {!showBcc && <button onClick={() => setShowBcc(true)}>Bcc</button>}
            </div>
            {/* <div style={{ display: 'flex', justifyContent: 'end', 'width': '100%' }}>
                {!showCc && <button onClick={() => setShowCc(true)}>Cc</button>}
                {!showBcc && <button onClick={() => setShowBcc(true)}>Bcc</button>}
            </div> */}
            <EmailFieldDivider />
            {showCc && (
                <>
                    <ReactMultiEmail emails={ccEmails} onChange={onCcChange} placeholder="Cc:" getLabel={getLabel} />
                    <EmailFieldDivider />
                </>
            )}
            {showBcc && (
                <>
                    <ReactMultiEmail emails={bccEmails} onChange={onBccChange} placeholder="Bcc:" getLabel={getLabel} />
                    <EmailFieldDivider />
                </>
            )}
        </EmailRecipientsContainer>
    )
}

export default EmailRecipientsInput
