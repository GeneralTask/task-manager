import './MultiEmailStyles.css'

import React, { useCallback, useState } from 'react'

import { ReactMultiEmail } from 'react-multi-email'
import styled from 'styled-components'

const REACT_MULTI_EMAIL_KB_SHORTCUT = ['Enter', 'Tab', 'Backspace']

const EmailRecipientsContainer = styled.div`
    display: flex;
    max-width: 100%;
    align-content: flex-start;
    flex: 1 0 auto;
    flex-wrap: wrap;
`
const EmailTag = styled.div`
    /* background-color: red; */
    /* color: purple; */
    max-width: 100%;
    margin: 0 4px;
`

const EmailRecipientsInput = () => {
    const [emails, setEmails] = useState<string[]>([])

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
