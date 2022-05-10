import { Colors, Spacing, Typography } from '../../styles'
import React, { Fragment, useEffect, useLayoutEffect, useState } from 'react'
import { TEmailComposeState, TEmailThread } from '../../utils/types'

import EmailContainer from './EmailContainer'
import { Icon } from '../atoms/Icon'
import { logos } from '../../styles/images'
import styled from 'styled-components'
import EmailCompose from './EmailCompose/EmailCompose'

const FlexColumnContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 300px;
`
const HeaderContainer = styled.div`
    flex: 0;
    display: flex;
    height: 70px;
    padding: ${Spacing.padding._16}px;
    align-items: center;
    background-color: ${Colors.white};
    position: sticky;
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
const EmailThreadsContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    min-width: 0;
`

interface ThreadDetailsProps {
    thread: TEmailThread | undefined
}
const ThreadDetails = ({ thread }: ThreadDetailsProps) => {
    const [composeState, setComposeState] = useState<TEmailComposeState>({
        emailComposeType: null,
        emailId: null,
    })
    useLayoutEffect(() => {
        setComposeState({
            emailComposeType: null,
            emailId: null,
        })
    }, [thread])
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
                    <EmailThreadsContainer>
                        {thread.emails.map((email, index) => (
                            <Fragment key={email.message_id}>
                                <EmailContainer
                                    email={email}
                                    isLastThread={index === thread.emails.length - 1}
                                    composeType={
                                        email.message_id === composeState.emailId ? composeState.emailComposeType : null
                                    }
                                    setThreadComposeState={setComposeState}
                                    sourceAccountId={thread.source.account_id}
                                />
                                {composeState.emailId === email.message_id &&
                                    index !== thread.emails.length - 1 &&
                                    composeState.emailComposeType != null && (
                                        <EmailCompose
                                            email={thread.emails[thread?.emails.length - 1]}
                                            composeType={composeState.emailComposeType}
                                            sourceAccountId={thread.source.account_id}
                                            onClose={() =>
                                                setComposeState({
                                                    emailComposeType: null,
                                                    emailId: null,
                                                })
                                            }
                                        />
                                    )}
                            </Fragment>
                        ))}
                    </EmailThreadsContainer>
                </>
            )}
            {thread &&
                composeState.emailId === thread.emails[thread.emails.length - 1].message_id &&
                composeState.emailComposeType != null && (
                    <EmailCompose
                        email={thread.emails[thread?.emails.length - 1]}
                        composeType={composeState.emailComposeType}
                        sourceAccountId={thread.source.account_id}
                        onClose={() => setComposeState({ emailComposeType: null, emailId: null })}
                    />
                )}
        </FlexColumnContainer>
    )
}

export default ThreadDetails
