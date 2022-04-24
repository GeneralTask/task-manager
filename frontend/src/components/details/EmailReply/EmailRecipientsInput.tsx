import './MultiEmailStyles.css'

import React, { useEffect, useRef, useState } from 'react'

import { ReactMultiEmail } from 'react-multi-email'
import styled from 'styled-components'

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
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // const input = document.querySelector('.react-multi-email > input')
        ref.current?.addEventListener('keydown', (e) => {
            e.stopPropagation()
        })
    }, [])

    return (
        <EmailRecipientsContainer ref={ref}>
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
