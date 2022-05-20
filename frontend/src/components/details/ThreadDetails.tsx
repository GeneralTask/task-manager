import { Colors, Shadows, Spacing, Typography } from '../../styles'
import React, { Fragment, useLayoutEffect, useState } from 'react'
import { SentEmailBanner, UndoButton } from './EmailCompose/EmailCompose-styles'
import { TEmailComposeState, TEmailThread } from '../../utils/types'

import EmailCompose from './EmailCompose/EmailCompose'
import EmailContainer from './EmailContainer'
import EmailMainActions from './EmailCompose/EmailMainActions'
import { Icon } from '../atoms/Icon'
import { icons, logos } from '../../styles/images'
import styled from 'styled-components'
import { useCreateTaskFromThread } from '../../services/api-query-hooks'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import { useNavigate } from 'react-router-dom'
import toast from '../../utils/toast'

const THREAD_HEADER_HEIGHT = '118px'

const FlexColumnContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 300px;
`
const HeaderContainer = styled.div`
    display: flex;
    height: ${THREAD_HEADER_HEIGHT};
    padding: 0 ${Spacing.padding._16}px;
    align-items: center;
    background-color: ${Colors.white};
    position: sticky;
    box-shadow: ${Shadows.threadHeaderShadow};
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
    font-size: ${Typography.medium.fontSize};
    line-height: ${Typography.medium.lineHeight};
    font-weight: ${Typography.weight._600};
    color: ${Colors.gray._600};
`
const SubTitle = styled(Title)`
    font-size: ${Typography.xSmall.fontSize};
    line-height: ${Typography.xSmall.lineHeight};
    font-weight: ${Typography.weight._400};
    color: ${Colors.gray._400};
`
const EmailThreadsContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    min-width: 0;
`

interface ThreadDetailsProps {
    thread: TEmailThread
}
const ThreadDetails = ({ thread }: ThreadDetailsProps) => {
    const navigate = useNavigate()
    const { mutate: createTaskFromThread } = useCreateTaskFromThread()
    const [composeState, setComposeState] = useState<TEmailComposeState>({
        emailComposeType: null,
        emailId: null,
    })
    useLayoutEffect(() => {
        setComposeState({
            emailComposeType: null,
            emailId: null,
        })
    }, [thread.id])

    const title = `${thread.emails[0]?.subject ?? ''} (${thread.emails.length ?? 0})`
    const recipient_emails = Array.from(
        new Set(
            thread.emails
                .map((email) => email.recipients.to)
                .flat()
                .map((recipient) => recipient.email)
        )
    )

    const onUndoSend = () => {
        if (composeState.undoTimeout) clearTimeout(composeState.undoTimeout)
        setComposeState({
            ...composeState,
            undoTimeout: undefined,
        })
    }

    const onClickHander = () => {
        createTaskFromThread({
            title: thread.emails[thread.emails.length - 1].subject,
            body: '',
            thread_id: thread.id,
        })
        toast({
            message: 'This thread was converted into a task.',
            rightAction: {
                label: 'View Task',
                onClick: () => {
                    navigate('/tasks')
                },
            },
        })
    }

    return (
        <FlexColumnContainer>
            <>
                <HeaderContainer>
                    <Icon size="medium" source={logos.gmail} />
                    <HeaderTitleContainer>
                        <Title>{title}</Title>
                        <SubTitle>{`To: ${recipient_emails.join(', ')}`}</SubTitle>
                    </HeaderTitleContainer>
                    <NoStyleButton onClick={onClickHander}>
                        <Icon source={icons.message_to_task} size="small" />
                    </NoStyleButton>
                </HeaderContainer>
                <EmailThreadsContainer>
                    {thread.emails.map((email, index) => (
                        <Fragment key={email.message_id}>
                            <EmailContainer
                                email={email}
                                isLastThread={index === thread.emails.length - 1}
                                setThreadComposeState={setComposeState}
                                sourceAccountId={thread.source.account_id}
                            />
                            {composeState.emailId === email.message_id &&
                                index !== thread.emails.length - 1 &&
                                composeState.emailComposeType != null && (
                                    <EmailCompose
                                        email={email}
                                        composeType={composeState.emailComposeType}
                                        sourceAccountId={thread.source.account_id}
                                        isPending={composeState.undoTimeout !== undefined}
                                        setThreadComposeState={setComposeState}
                                    />
                                )}
                        </Fragment>
                    ))}

                    {composeState.undoTimeout !== undefined && (
                        <SentEmailBanner>
                            Your email was sent.
                            <UndoButton onClick={onUndoSend}>Undo</UndoButton>
                        </SentEmailBanner>
                    )}
                </EmailThreadsContainer>
                {composeState.emailComposeType === null && (
                    <EmailMainActions
                        email={thread.emails[thread.emails.length - 1]}
                        setThreadComposeState={setComposeState}
                    />
                )}
            </>
            {composeState.emailId === thread.emails[thread.emails.length - 1].message_id &&
                composeState.emailComposeType != null && (
                    <EmailCompose
                        email={thread.emails[thread.emails.length - 1]}
                        composeType={composeState.emailComposeType}
                        sourceAccountId={thread.source.account_id}
                        isPending={composeState.undoTimeout !== undefined}
                        setThreadComposeState={setComposeState}
                    />
                )}
        </FlexColumnContainer>
    )
}

export default ThreadDetails
