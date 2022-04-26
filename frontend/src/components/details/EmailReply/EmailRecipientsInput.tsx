// import './MultiEmailStyles.css'

import { EmailRecipientsContainer, EmailTag } from './EmailReplyStyles'
import React, { useCallback, useEffect, useState } from 'react'

import { ReactMultiEmail } from 'react-multi-email'

// Keyboard shortcuts used in react-multi-email/ReactMultiEmail.tsx
const REACT_MULTI_EMAIL_KB_SHORTCUT = ['Enter', 'Tab', 'Backspace']

interface EmailRecipientsInputProps {
    sender: string
}

const EmailRecipientsInput = ({ sender }: EmailRecipientsInputProps) => {
    const [emails, setEmails] = useState<string[]>([sender])

    useEffect(() => setEmails([sender]), [sender])

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
            <ReactMultiEmail
                emails={emails}
                onChange={(_emails: string[]) => {
                    setEmails(_emails)
                }}
                placeholder="To:"
                getLabel={(email: string, index: number, removeEmail: (index: number) => void) => {
                    return (
                        <EmailTag key={index}>
                            {email}
                            <span data-tag-handle onClick={() => removeEmail(index)}>
                                ×
                            </span>
                        </EmailTag>
                    )
                }}
            />
        </EmailRecipientsContainer>
    )
}

export default EmailRecipientsInput
