import React from 'react'
import { logos } from '../../styles/images'
import { TEmailThread } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import TaskHTMLBody from '../atoms/TaskHTMLBody'
import EmailSenderDetails from '../molecules/EmailSenderDetails'
import DetailsTemplate, { Title } from './DetailsTemplate'

interface ThreadDetailsProps {
    thread: TEmailThread
}
const ThreadDetails = ({ thread }: ThreadDetailsProps) => {
    return (
        <DetailsTemplate
            top={<Icon source={logos[thread.source.logo_v2]} size="small" />}
            title={<Title>{thread.emails[0]?.subject}</Title>}
            subtitle={<EmailSenderDetails sender={thread.emails[0]?.sender_v2} recipients={thread.emails[0]?.recipients} />}
            body={<TaskHTMLBody dirtyHTML={thread.emails[0]?.body} />}
        />
    )
}

export default ThreadDetails
