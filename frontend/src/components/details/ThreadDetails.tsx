import React from 'react'
import styled from 'styled-components'
import { logos } from '../../styles/images'
import { TEmailThread } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import TaskHTMLBody from '../atoms/TaskHTMLBody'
import EmailSenderDetails from '../molecules/EmailSenderDetails'
import DetailsTemplate, { Title } from './DetailsTemplate'

const FlexColumnContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: auto;
`
interface ThreadDetailsProps {
    thread: TEmailThread
}
const ThreadDetails = ({ thread }: ThreadDetailsProps) => {
    return (
        <FlexColumnContainer>
            {
                thread.emails.map((email, index) => (
                    <DetailsTemplate
                        key={email.message_id}
                        top={<Icon source={logos[thread.source.logo_v2]} size="small" />}
                        title={<Title>{email.subject}</Title>}
                        subtitle={<EmailSenderDetails sender={email.sender} recipients={email.recipients} />}
                        body={<TaskHTMLBody dirtyHTML={email.body} />}
                        collapsed={index !== thread.emails.length - 1}
                    />
                ))
            }
        </FlexColumnContainer>
    )
}

export default ThreadDetails
