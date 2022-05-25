import { Colors, Shadows, Spacing, Typography } from '../../styles'
import React, { Fragment, useLayoutEffect, useState } from 'react'
import { TEmailComposeState, TEmailThread } from '../../utils/types'
import { icons, logos } from '../../styles/images'

import EmailCompose from './email/EmailCompose/EmailCompose'
import EmailContainer from './email/EmailContainer'
import EmailMainActions from './email/EmailCompose/EmailMainActions'
import { Icon } from '../atoms/Icon'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import styled from 'styled-components'
import toast from '../../utils/toast'
import { useCreateTaskFromThread, useModifyThread } from '../../services/api-query-hooks'
import { useNavigate } from 'react-router-dom'
import PreviousMessages from './email/PreviousMessages'

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
    gap: ${Spacing.margin._8}px;
    box-shadow: ${Shadows.threadHeaderShadow};
`
const HeaderTitleContainer = styled.div`
    display: flex;
    flex: 1;
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
    const [isCollapsed, setIsCollapsed] = useState(true)
    const [isUnread, setIsUnread] = useState(thread.emails.some((email) => email.is_unread))
    const navigate = useNavigate()
    const { mutate: createTaskFromThread } = useCreateTaskFromThread()
    const { mutate: modifyThread } = useModifyThread()
    const [composeState, setComposeState] = useState<TEmailComposeState>({
        emailComposeType: null,
        emailId: null,
    })
    useLayoutEffect(() => {
        setIsUnread(thread.emails.some((email) => email.is_unread))
    }, [thread])
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

    const onClickMarkAsTask = () => {
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

    const onClickMarkAsRead = () => {
        modifyThread({
            thread_id: thread.id,
            is_unread: !isUnread,
        })
        toast({
            message: `This thread was marked as ${!isUnread ? 'unread' : 'read'}.`,
        })
        setIsUnread(!isUnread)
    }

    return (
        <FlexColumnContainer>
            <HeaderContainer>
                <Icon size="medium" source={logos.gmail} />
                <HeaderTitleContainer>
                    <Title>{title}</Title>
                    <SubTitle>{`To: ${recipient_emails.join(', ')}`}</SubTitle>
                </HeaderTitleContainer>
                <NoStyleButton onClick={onClickMarkAsTask}>
                    <Icon source={icons.message_to_task} size="small" />
                </NoStyleButton>
                <NoStyleButton onClick={onClickMarkAsRead}>
                    <Icon source={isUnread ? icons.mark_read : icons.mark_unread} size="small" />
                </NoStyleButton>
            </HeaderContainer>
            <EmailThreadsContainer>
                {isCollapsed && thread.emails.length > 2 ? (
                    <>
                        <Fragment key={thread.emails[0].message_id}>
                            <EmailContainer
                                email={thread.emails[0]}
                                isLastThread={thread.emails.length - 1 === 0}
                                setThreadComposeState={setComposeState}
                                sourceAccountId={thread.source.account_id}
                            />
                            {composeState.emailId === thread.emails[0].message_id &&
                                0 !== thread.emails.length - 1 &&
                                composeState.emailComposeType != null && (
                                    <EmailCompose
                                        email={thread.emails[thread?.emails.length - 1]}
                                        composeType={composeState.emailComposeType}
                                        sourceAccountId={thread.source.account_id}
                                        isPending={!!composeState.isPending}
                                        setThreadComposeState={setComposeState}
                                    />
                                )}
                        </Fragment>
                        <PreviousMessages
                            numMessages={thread.emails.length - 2}
                            onClick={() => setIsCollapsed(false)}
                        />
                        <Fragment key={thread.emails[thread.emails.length - 1].message_id}>
                            <EmailContainer
                                email={thread.emails[thread.emails.length - 1]}
                                isLastThread={true}
                                setThreadComposeState={setComposeState}
                                sourceAccountId={thread.source.account_id}
                            />
                        </Fragment>
                    </>
                ) : (
                    thread.emails.map((email, index) => (
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
                                        email={thread.emails[thread?.emails.length - 1]}
                                        composeType={composeState.emailComposeType}
                                        sourceAccountId={thread.source.account_id}
                                        isPending={!!composeState.isPending}
                                        setThreadComposeState={setComposeState}
                                    />
                                )}
                        </Fragment>
                    ))
                )}
            </EmailThreadsContainer>
            {composeState.emailId === thread.emails[thread.emails.length - 1].message_id &&
                composeState.emailComposeType != null && (
                    <EmailCompose
                        email={thread.emails[thread.emails.length - 1]}
                        composeType={composeState.emailComposeType}
                        sourceAccountId={thread.source.account_id}
                        isPending={!!composeState.isPending}
                        setThreadComposeState={setComposeState}
                    />
                )}
            {composeState.emailComposeType === null && (
                <EmailMainActions
                    email={thread.emails[thread.emails.length - 1]}
                    setThreadComposeState={setComposeState}
                />
            )}
        </FlexColumnContainer>
    )
}

export default ThreadDetails
