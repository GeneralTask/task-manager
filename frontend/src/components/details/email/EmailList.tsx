import React, { Fragment, useLayoutEffect, useState } from 'react'
import styled from 'styled-components'
import { TEmailComposeState, TEmailThread } from '../../../utils/types'
import EmailCompose from './compose/EmailCompose'
import EmailMainActions from './compose/MainActions'
import EmailContainer from './EmailContainer'
import PreviousMessages from './PreviousMessages'

const EmailThreadsContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    min-width: 0;
`
interface EmailListProps {
    thread: TEmailThread
}

export const EmailList = ({ thread }: EmailListProps) => {
    const [isCollapsed, setIsCollapsed] = useState(true)
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

    if (thread.emails.length < 1) return <></>

    return (
        <>
            <EmailThreadsContainer>
                {isCollapsed && thread.emails.length > 4 ? (
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
                        <Fragment key={thread.emails[thread.emails.length - 1]?.message_id}>
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
        </>
    )
}
