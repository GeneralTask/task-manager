import { Colors, Shadows, Spacing, Typography } from '../../styles'
import React, { useEffect, useMemo } from 'react'
import { TEmailThread } from '../../utils/types'
import { icons, logos } from '../../styles/images'

import { Icon } from '../atoms/Icon'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import styled from 'styled-components'
import toast from '../../utils/toast'
import { useCreateTaskFromThread, useModifyThread } from '../../services/api-query-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { EmailList } from './email/EmailList'
import TooltipWrapper from '../atoms/TooltipWrapper'
import ReactTooltip from 'react-tooltip'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import NoStyleAnchor from '../atoms/NoStyleAnchor'

const MARK_AS_READ = 'Mark as Read'
const MARK_AS_UNREAD = 'Mark as Unread'

const FlexColumnContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 300px;
`
const HeaderContainer = styled.div`
    padding: ${Spacing.padding._24} ${Spacing.padding._24} ${Spacing.padding._16};
    background-color: ${Colors.white};
    position: sticky;
    box-shadow: ${Shadows.threadHeaderShadow};
`
const ActionsContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing.padding._16};
    margin-bottom: ${Spacing.margin._12};
`
const TitleContainer = styled.div`
    display: flex;
`
const LogoContainer = styled.div`
    margin-top: ${Spacing.margin._4};
`
const DeeplinkContainer = styled.div`
    margin-left: auto;
`
const HeaderTitleContainer = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
`
const Title = styled.span`
    margin-left: ${Spacing.margin._16};
    font-size: ${Typography.medium.fontSize};
    line-height: ${Typography.medium.lineHeight};
    font-weight: ${Typography.weight._500};
    color: ${Colors.gray._600};
`
const SubTitle = styled(Title)`
    font-size: ${Typography.xSmall.fontSize};
    line-height: ${Typography.xSmall.lineHeight};
    font-weight: ${Typography.weight._400};
    color: ${Colors.gray._400};
`

interface ThreadDetailsProps {
    thread: TEmailThread
}
const ThreadDetails = ({ thread }: ThreadDetailsProps) => {
    const params = useParams()
    const isUnread = useMemo(
        () => thread.emails.some((email) => email.is_unread),
        [JSON.stringify(thread.emails.map((email) => email.is_unread))]
    )
    const navigate = useNavigate()
    const { mutate: createTaskFromThread } = useCreateTaskFromThread()
    const { mutate: modifyThread } = useModifyThread()
    useEffect(() => {
        ReactTooltip.hide()
        ReactTooltip.rebuild()
    }, [isUnread])

    const threadCountString = thread.emails.length > 1 ? `(${thread.emails.length}) ` : ''
    const title = `${threadCountString}${thread.emails[0]?.subject}`
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
    }
    const onClickArchive = () => {
        modifyThread({
            thread_id: thread.id,
            is_archived: true,
        })
        toast({
            message: 'This thread was archived.',
        })
    }

    return (
        <FlexColumnContainer>
            <HeaderContainer>
                <ActionsContainer>
                    <TooltipWrapper inline dataTip="Mark as Task" tooltipId="tooltip">
                        <NoStyleButton onClick={onClickMarkAsTask}>
                            <Icon source={icons.message_to_task} size="small" />
                        </NoStyleButton>
                    </TooltipWrapper>
                    <TooltipWrapper inline dataTip={isUnread ? MARK_AS_READ : MARK_AS_UNREAD} tooltipId="tooltip">
                        <NoStyleButton onClick={onClickMarkAsRead}>
                            <Icon source={isUnread ? icons.mark_read : icons.mark_unread} size="small" />
                        </NoStyleButton>
                    </TooltipWrapper>
                    {params.mailbox !== 'archive' && (
                        <TooltipWrapper inline dataTip="Archive" tooltipId="tooltip">
                            <NoStyleButton onClick={onClickArchive}>
                                <Icon source={icons.archive_purple} size="small" />
                            </NoStyleButton>
                        </TooltipWrapper>
                    )}
                    <DeeplinkContainer>
                        {thread.deeplink && (
                            <NoStyleAnchor href={thread.deeplink} target="_blank" rel="noreferrer">
                                <RoundedGeneralButton
                                    textStyle="dark"
                                    value={thread.source.name}
                                    hasBorder
                                    iconSource="external_link"
                                />
                            </NoStyleAnchor>
                        )}
                    </DeeplinkContainer>
                </ActionsContainer>
                <TitleContainer>
                    <LogoContainer>
                        <Icon size="medium" source={logos.gmail} />
                    </LogoContainer>
                    <HeaderTitleContainer>
                        <Title>{title}</Title>
                        <SubTitle>{`To: ${recipient_emails.join(', ')}`}</SubTitle>
                    </HeaderTitleContainer>
                </TitleContainer>
            </HeaderContainer>
            <EmailList thread={thread} />
        </FlexColumnContainer>
    )
}

export default ThreadDetails
