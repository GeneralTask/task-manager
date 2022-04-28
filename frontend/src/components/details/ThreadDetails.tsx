import { DateTime } from 'luxon'
import React, { useState } from 'react'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TEmailComposeState, TEmailThread } from '../../utils/types'
import { getHumanTimeSinceDateTime } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import EmailTemplate from './EmailTemplate'
import { Icon } from '../atoms/Icon'
import { logos } from '../../styles/images'
import styled from 'styled-components'

const FlexColumnContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 300px;
    overflow-y: auto;
`
const HeaderContainer = styled.div`
    flex: 0;
    display: flex;
    height: 70px;
    padding: ${Spacing.padding._16}px;
    align-items: center;
    background-color: ${Colors.white};
`
const HeaderTitleContainer = styled.div`
    display: flex;
    flex: 1;
    margin-left: ${Spacing.margin._8}px;
    flex-direction: column;
    min-width: 0;
`
const Title = styled.span`
    margin-left: ${Spacing.margin._8}px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: Switzer-Variable;
    font-size: ${Typography.small.fontSize};
    color: ${Colors.gray._600};
`
const SubTitle = styled(Title)`
    font-size: ${Typography.xSmall.fontSize};
    color: ${Colors.gray._400};
`

interface ThreadDetailsProps {
    thread: TEmailThread | undefined
}
const ThreadDetails = ({ thread }: ThreadDetailsProps) => {
    const [composeState, setComposeState] = useState<TEmailComposeState>({
        emailComposeType: null,
        showComposeForEmailId: null,
    })
    const title = `${thread?.emails[0]?.subject ?? ''} (${thread?.emails.length ?? 0})`
    const recipient_emails = Array.from(
        new Set(
            thread?.emails
                .map((email) => email.recipients.to)
                .flat()
                .map((recipient) => recipient.email)
        )
    )

    return (
        <FlexColumnContainer>
            {thread && (
                <>
                    <HeaderContainer>
                        <Icon size={'medium'} source={logos.gmail} />
                        <HeaderTitleContainer>
                            <Title>{title}</Title>
                            <SubTitle>{`To: ${recipient_emails.join(', ')}`}</SubTitle>
                        </HeaderTitleContainer>
                    </HeaderContainer>
                    {thread.emails.map((email, index) => (
                        <EmailTemplate
                            email={email}
                            key={email.message_id}
                            time_sent={getHumanTimeSinceDateTime(DateTime.fromISO(email.sent_at))}
                            isCollapsed={index !== thread.emails.length - 1}
                            composeType={
                                email.message_id !== composeState.showComposeForEmailId
                                    ? null
                                    : composeState.emailComposeType
                            }
                            setThreadComposeState={setComposeState}
                            sourceAccountId={thread.source.account_id}
                            showMainActions={index === thread.emails.length - 1}
                        />
                    ))}
                </>
            )}
        </FlexColumnContainer>
    )
}

export default ThreadDetails
