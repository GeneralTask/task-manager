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
                thread.emails.map(email => (
                    <DetailsTemplate
                        key={email.message_id}
                        top={<Icon source={logos[thread.source.logo_v2]} size="small" />}
                        title={<Title>{email.subject}</Title>}
                        subtitle={<EmailSenderDetails sender={email.sender_v2 ?? ''} recipients={email.recipients} />}
                        body={<TaskHTMLBody dirtyHTML={email.body} />}
                    />
                ))
            }
        </FlexColumnContainer>
    )
}

export default ThreadDetails
