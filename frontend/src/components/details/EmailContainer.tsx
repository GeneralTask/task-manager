import { Border, Colors, Spacing, Typography } from '../../styles'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TEmail, TEmailComposeState } from '../../utils/types'

import EmailCompose from './EmailCompose/EmailCompose'
import { EmailComposeType } from '../../utils/enums'
import EmailMainActions from './EmailCompose/EmailMainActions'
import EmailSenderDetails from '../molecules/EmailSenderDetails'
import GTSelect from '../molecules/GTSelect'
import { Icon } from '../atoms/Icon'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import ReactTooltip from 'react-tooltip'
import SanitizedHTML from '../atoms/SanitizedHTML'
import { icons } from '../../styles/images'
import { getHumanDateTime, removeHTMLTags } from '../../utils/utils'
import styled from 'styled-components'
import { DateTime } from 'luxon'

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
const EmailActionContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing.padding._8}px;
`
const IconButton = styled(NoStyleButton)`
    border-radius: ${Border.radius.xxSmall};
    position: relative;
    padding: ${Spacing.padding._4}px;
    &:hover {
        background-color: ${Colors.gray._200};
    }
`

interface EmailContainerProps {
    email: TEmail
    isLastThread: boolean
    composeType: EmailComposeType | null // null if not in compose mode, otherwise the compose type
    setThreadComposeState: (state: TEmailComposeState) => void
    sourceAccountId: string
}

const EmailContainer = (props: EmailContainerProps) => {
    const [isCollapsed, setIsCollapsed] = useState(props.isLastThread)
    const [showEmailActions, setShowEmailActions] = useState(false)
    const timeSent = getHumanDateTime(DateTime.fromISO(props.email.sent_at))
    const scrollingRef = useRef<HTMLDivElement>(null)
    const emailActionsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        ReactTooltip.hide()
        ReactTooltip.rebuild()
    }, [])

    useLayoutEffect(() => {
        setIsCollapsed(props.isLastThread)
        if (props.isLastThread) {
            scrollingRef.current?.scrollIntoView()
        }
    }, [props.isLastThread])

    const handleEmailActionsButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        setShowEmailActions((show) => !show)
    }

    const emailActionOptions = [
        {
            item: (
                <EmailActionContainer>
                    <Icon size="medium" source={icons.reply} />
                    Reply
                </EmailActionContainer>
            ),
            onClick: () => {
                console.log(props.isLastThread)
                props.setThreadComposeState({
                    emailComposeType: EmailComposeType.REPLY,
                    emailId: props.email.message_id,
                    isLastEmail: props.isLastThread,
                })
            },
        },
        {
            item: (
                <EmailActionContainer>
                    <Icon size="medium" source={icons.replyAll} />
                    Reply All
                </EmailActionContainer>
            ),
            onClick: () => {
                props.setThreadComposeState({
                    emailComposeType: EmailComposeType.REPLY_ALL,
                    emailId: props.email.message_id,
                    isLastEmail: props.isLastThread,
                })
            },
        },
        {
            item: (
                <EmailActionContainer>
                    <Icon size="medium" source={icons.forward} />
                    Forward
                </EmailActionContainer>
            ),
            onClick: () => {
                props.setThreadComposeState({
                    emailComposeType: EmailComposeType.FORWARD,
                    emailId: props.email.message_id,
                    isLastEmail: props.isLastThread,
                })
            },
        },
    ]

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
                    <div ref={emailActionsRef}>
                        <IconButton onClick={handleEmailActionsButtonClick}>
                            <Icon size="small" source={icons.skinnyHamburger} />
                        </IconButton>
                        {showEmailActions && (
                            <GTSelect
                                options={emailActionOptions}
                                onClose={() => setShowEmailActions(false)}
                                parentRef={emailActionsRef}
                            />
                        )}
                    </div>
                </SenderContainer>
                {isCollapsed && <BodyContainerCollapsed>{removeHTMLTags(props.email.body)}</BodyContainerCollapsed>}
            </CollapseExpandContainer>
            {isCollapsed || (
                <BodyContainer>
                    <SanitizedHTML dirtyHTML={props.email.body} />
                </BodyContainer>
            )}
            {props.composeType != null && !props.isLastThread && (
                <EmailCompose
                    email={props.email}
                    composeType={props.composeType}
                    sourceAccountId={props.sourceAccountId}
                    onClose={() =>
                        props.setThreadComposeState({
                            emailComposeType: null,
                            emailId: null,
                            isLastEmail: props.isLastThread,
                        })
                    }
                />
            )}
            {props.composeType == null && props.isLastThread && (
                <EmailMainActions email={props.email} setThreadComposeState={props.setThreadComposeState} />
            )}
        </DetailsViewContainer>
    )
}

export default EmailContainer
