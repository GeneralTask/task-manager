import React, { useEffect, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import { logos } from '../../styles/images'
import { TMessage } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import TaskHTMLBody from '../atoms/TaskHTMLBody'
import DetailsTemplate, { Title } from './DetailsTemplate'

interface MessageDetailsProps {
    message: TMessage
}
const MessageDetails = (props: MessageDetailsProps) => {
    const [message, setMessage] = useState<TMessage>(props.message)

    useEffect(() => {
        ReactTooltip.rebuild()
    }, [])

    // Update the state when the message changes
    useEffect(() => {
        setMessage(props.message)
    }, [props.message])

    return (
        <DetailsTemplate
            top={<Icon source={logos[message.source.logo_v2]} size="small" />}
            title={<Title>{message.title}</Title>}
            body={<TaskHTMLBody dirtyHTML={message.body} />}
        />
    )
}

export default MessageDetails
