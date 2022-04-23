import './MultiEmailStyles.css'

import React, { useEffect, useState } from 'react'

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
    margin: 0 4px;
`

const EmailRecipientsInput = () => {
    const [emails, setEmails] = useState<string[]>([])
    // const ref = useRef<HTMLInputElement>()

    useEffect(() => {
        const input = document.querySelector('.react-multi-email > input')
        if (input) {
            input.addEventListener('keydown', (e) => {
                e.stopPropagation()
            })
        }
    }, [])

    // console.log({ text: ref.current?.value })

    // const duck = React.createElement(ReactMultiEmail, {
    //     emails,
    //     onChange: (_emails: string[]) => {
    //         setEmails(_emails)
    //     },
    //     getLabel: (email: string, index: number, removeEmail: (index: number) => void) => {
    //         return (
    //             <EmailTag key={index}>
    //                 {email}
    //                 <span data-tag-handle onClick={() => removeEmail(index)}>
    //                     ×
    //                 </span>
    //             </EmailTag>
    //         )
    //     }
    // })

    return (
        <EmailRecipientsContainer>
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
