import { EmailRecipientsContainer, EmailTag } from './EmailCompose-styles'
import React, { useCallback, useEffect, useState } from 'react'

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
    const [emails, setEmails] = useState<string[]>(recipients.to.map((r) => r.email))

    // need a separate state because ReactMultiEmail needs an array of strings, but recipients is an array of objects
    useEffect(() => {
        setRecipients({
            ...recipients,
            to: emails.map((r) => ({ email: r, name: '' })),
        })
    }, [emails])

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

    const onChange = useCallback((newEmails: string[]) => setEmails(newEmails), [setEmails])
    const getLabel = useCallback((email: string, index: number, removeEmail: (index: number) => void) => {
        return (
            <EmailTag key={index}>
                {email}
                <span data-tag-handle onClick={() => removeEmail(index)}>
                    ×
                </span>
            </EmailTag>
        )
    }, [])

    return (
        <EmailRecipientsContainer ref={enableBuiltInKBShortcuts}>
            <ReactMultiEmail emails={emails} onChange={onChange} placeholder="To:" getLabel={getLabel} />
        </EmailRecipientsContainer>
    )
}

export default EmailRecipientsInput
