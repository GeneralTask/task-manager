import { Colors, Spacing, Typography } from '../../styles'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TEmail, TEmailComposeState } from '../../utils/types'
import { getHumanDateTime, removeHTMLTags } from '../../utils/utils'

import { DateTime } from 'luxon'
import EmailCompose from './EmailCompose/EmailCompose'
import EmailComposeTypeSelector from './EmailCompose/EmailComposeTypeSelector'
import EmailSenderDetails from '../molecules/EmailSenderDetails'
import ReactTooltip from 'react-tooltip'
import SanitizedHTML from '../atoms/SanitizedHTML'
import styled from 'styled-components'

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
    justify-content: space-between;
`
const SentAtContainer = styled.div`
    font-size: ${Typography.xSmall.fontSize};
    margin-left: ${Spacing.margin._8}px;
`
const BodyContainer = styled.div`
    flex: 1;
    margin: ${Spacing.margin._8}px;
`
const BodyContainerCollapsed = styled.span`
    margin-left: ${Spacing.margin._8}px;
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
const Flex = styled.div`
    display: flex;
`

interface EmailContainerProps {
    email: TEmail
    isLastThread: boolean
    composeState: TEmailComposeState
    setThreadComposeState: React.Dispatch<React.SetStateAction<TEmailComposeState>>
    sourceAccountId: string
}

const EmailContainer = (props: EmailContainerProps) => {
    const [isCollapsed, setIsCollapsed] = useState(!props.isLastThread)
    const timeSent = getHumanDateTime(DateTime.fromISO(props.email.sent_at))
    const scrollingRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        ReactTooltip.hide()
        ReactTooltip.rebuild()
    }, [])

    useLayoutEffect(() => {
        setIsCollapsed(!props.isLastThread)
        if (props.isLastThread) {
            scrollingRef.current?.scrollIntoView()
        }
    }, [props.isLastThread])

    return (
        <DetailsViewContainer ref={scrollingRef}>
            <CollapseExpandContainer onClick={() => setIsCollapsed(!isCollapsed)}>
                <SenderContainer>
                    <div>
                        <Flex>
                            <Title>{props.email.sender.name}</Title>
                            <SentAtContainer>{timeSent}</SentAtContainer>
                        </Flex>
                        <EmailSenderDetails sender={props.email.sender} recipients={props.email.recipients} />
                    </div>
                    <EmailComposeTypeSelector
                        email={props.email}
                        isNewEmail={true}
                        setThreadComposeState={props.setThreadComposeState}
                    />
                </SenderContainer>
                {isCollapsed && <BodyContainerCollapsed>{removeHTMLTags(props.email.body)}</BodyContainerCollapsed>}
            </CollapseExpandContainer>
            {isCollapsed || (
                <BodyContainer>
                    <SanitizedHTML dirtyHTML={props.email.body} />
                </BodyContainer>
            )}
            {props.composeState.emailComposeType != null && props.composeState.emailId === props.email.message_id && (
                <EmailCompose
                    email={props.email}
                    composeType={props.composeState.emailComposeType}
                    isPending={props.composeState.undoTimeout !== undefined}
                    sourceAccountId={props.sourceAccountId}
                    setThreadComposeState={props.setThreadComposeState}
                />
            )}
        </DetailsViewContainer>
    )
}

export default EmailContainer
