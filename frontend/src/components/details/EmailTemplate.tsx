import { Border, Colors, Images, Spacing, Typography } from '../../styles'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { TEmail, TEmailComposeState, TRecipients } from '../../utils/types'

import EmailCompose from './EmailCompose/EmailCompose'
import { EmailComposeType } from '../../utils/enums'
import EmailMainActions from './EmailCompose/EmailMainActions'
import EmailSenderDetails from '../molecules/EmailSenderDetails'
import GTSelect from '../molecules/GTSelect'
import { Icon } from '../atoms/Icon'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import ReactTooltip from 'react-tooltip'
import SanitizedHTML from '../atoms/SanitizedHTML'
import { removeHTMLTags } from '../../utils/utils'
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
const IconButton = styled(NoStyleButton)`
    border-radius: ${Border.radius.xxSmall};
    position: relative;
    &:hover {
        background-color: ${Colors.gray._200};
    }
`
interface EmailTemplateProps {
    email: TEmail
    timeSent?: string
    isCollapsed: boolean
    composeType: EmailComposeType | null // null if not in compose mode, otherwise the compose type
    setThreadComposeState: (state: TEmailComposeState) => void
    sourceAccountId: string
    showMainActions: boolean
}

const EmailTemplate = (props: EmailTemplateProps) => {
    const [isCollapsed, setIsCollapsed] = useState(!!props.isCollapsed)
    const [showEmailActions, setShowEmailActions] = useState(false)

    useEffect(() => setIsCollapsed(!!props.isCollapsed), [props.isCollapsed])
    useEffect(() => {
        ReactTooltip.hide()
        ReactTooltip.rebuild()
    }, [])

    const initialReplyRecipients: TRecipients = {
        to: [props.email.sender],
        cc: [],
        bcc: [],
    }

    const emailActionsButtonRef = useRef<HTMLButtonElement>(null)

    const handleEmailActionsButtonClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        setShowEmailActions((show) => !show)
    }, [])

    return (
        <DetailsViewContainer>
            <CollapseExpandContainer onClick={() => setIsCollapsed(!isCollapsed)}>
                <SenderContainer>
                    <div>
                        <Flex>
                            <Title>{props.email.sender.name}</Title>
                            <SentAtContainer>{props.timeSent}</SentAtContainer>
                        </Flex>
                        <EmailSenderDetails sender={props.email.sender} recipients={props.email.recipients} />
                    </div>
                    <div>
                        <IconButton ref={emailActionsButtonRef} onClick={handleEmailActionsButtonClick}>
                            <Icon size="small" source={Images.icons.skinnyHamburger} />
                        </IconButton>
                        {showEmailActions && (
                            <GTSelect
                                options={['hi', 'there']}
                                onClose={() => setShowEmailActions(false)}
                                parentRef={emailActionsButtonRef}
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
            {props.composeType != null && (
                <EmailCompose
                    email={props.email}
                    initialRecipients={initialReplyRecipients}
                    composeType={props.composeType}
                    sourceAccountId={props.sourceAccountId}
                    onClose={() => props.setThreadComposeState({ emailComposeType: null, emailId: null })}
                />
            )}
            {props.composeType == null && props.showMainActions && (
                <EmailMainActions
                    emailId={props.email.message_id}
                    setThreadComposeState={props.setThreadComposeState}
                />
            )}
        </DetailsViewContainer>
    )
}

export default EmailTemplate
