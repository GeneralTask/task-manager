import React from 'react'
import styled from 'styled-components'
import { TEmailThread } from '../../utils/types'
import EmailTemplate from './EmailTemplate'

const FlexColumnContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: auto;
`
interface ThreadDetailsProps {
    thread: TEmailThread | undefined
}
const ThreadDetails = ({ thread }: ThreadDetailsProps) => {
    return (
        <FlexColumnContainer>
            {
                thread && thread.emails.map((email, index) => (
                    <EmailTemplate
                        key={index}
                        sender={email.sender.name}
                        // subtitle={<EmailSenderDetails sender={email.sender} recipients={email.recipients} />}
                        body={email.body}
                        collapsed={index !== thread.emails.length - 1}
                    />
                ))
            }
        </FlexColumnContainer>
    )
}

export default ThreadDetails
