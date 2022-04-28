import { Colors, Spacing, Typography } from '../../styles'
import React, { useEffect, useState } from 'react'
import { TEmail, TEmailComposeState, TRecipients } from '../../utils/types'

import EmailCompose from './EmailCompose/EmailCompose'
import { EmailComposeType } from '../../utils/enums'
import EmailMainActions from './EmailCompose/EmailMainActions'
import SanitizedHTML from '../atoms/SanitizedHTML'
import { removeHTMLTags } from '../../utils/utils'
import styled from 'styled-components'
import { TRecipients, TSender } from '../../utils/types'
import EmailSenderDetails from '../molecules/EmailSenderDetails'
import ReactTooltip from 'react-tooltip'

const DetailsViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    background-color: ${Colors.gray._50};
    border-bottom: 1px solid ${Colors.gray._200};
`
const CollapseExpandContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0;
    cursor: pointer;
`
const SenderContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing.padding._4}px ${Spacing.padding._8}px;
    height: 50px;
`
const SentAtContainer = styled.div`
    margin-left: auto;
`
const BodyContainer = styled.div`
    flex: 1;
    margin: ${Spacing.margin._8}px;
`
const BodyContainerCollapsed = styled.span`
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    min-width: 0;
    color: ${Colors.gray._400};
`

const Title = styled.div`
    background-color: inherit;
    color: ${Colors.gray._600};
    font: inherit;
    font-size: ${Typography.xSmall.fontSize};
    font-weight: ${Typography.weight._600};
    overflow: hidden;
    display: flex;
    flex: 1;
`
interface EmailTemplateProps {
    email: TEmail
    time_sent?: string
    isCollapsed: boolean
    composeType: EmailComposeType | null // null if not in compose mode, otherwise the compose type
    setThreadComposeState: (state: TEmailComposeState) => void
    sourceAccountId: string
    showMainActions: boolean
}

const EmailTemplate = (props: EmailTemplateProps) => {
    const [isCollapsed, setIsCollapsed] = useState(!!props.isCollapsed)

    useEffect(() => setIsCollapsed(!!props.isCollapsed), [props.isCollapsed])
    useEffect(() => {
        ReactTooltip.hide()
        ReactTooltip.rebuild()
    }, [])

    useEffect(() => setIsCollapsed(false), [props.email])

    const initialReplyRecipients: TRecipients = {
        to: [props.email.sender],
        cc: [],
        bcc: [],
    }

    return (
        <DetailsViewContainer>
            <CollapseExpandContainer onClick={() => setIsCollapsed(!isCollapsed)}>
                <SenderContainer>
                    <div>
                        <Title>{props.email.sender.name}</Title>
                        <EmailSenderDetails sender={props.email.sender} recipients={props.email.recipients} />
                    </div>
                    <SentAtContainer>{props.time_sent}</SentAtContainer>
                </SenderContainer >
    { isCollapsed && <BodyContainerCollapsed>{removeHTMLTags(props.email.body)}</BodyContainerCollapsed>}
            </CollapseExpandContainer >
    { isCollapsed || (
        <BodyContainer>
            <SanitizedHTML dirtyHTML={props.email.body} />
        </BodyContainer>
    )}
{
    props.composeType != null && (
        <EmailCompose
            email={props.email}
            initialRecipients={initialReplyRecipients}
            composeType={props.composeType}
            sourceAccountId={props.sourceAccountId}
            discardDraft={() =>
                props.setThreadComposeState({ emailComposeType: null, showComposeForEmailId: null })
            }
        />
    )
}
{
    props.composeType == null && props.showMainActions && (
        <EmailMainActions
            emailId={props.email.message_id}
            setThreadComposeState={props.setThreadComposeState}
        />
    )
}
        </DetailsViewContainer >
    )
}

export default EmailTemplate
