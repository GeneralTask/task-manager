import { DateTime } from 'luxon'
import React from 'react'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TEmailThread } from '../../utils/types'
import { getHumanTimeSinceDateTime } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import EmailTemplate from './EmailTemplate'

const FlexColumnContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    width: 700px;
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
                            key={email.message_id}
                            sender={email.sender}
                            recipients={email.recipients}
                            time_sent={getHumanTimeSinceDateTime(DateTime.fromISO(email.sent_at))}
                            body={email.body}
                            isCollapsed={index !== thread.emails.length - 1}
                        />
                    ))}
                </>
            )}
        </FlexColumnContainer>
    )
}

export default ThreadDetails
