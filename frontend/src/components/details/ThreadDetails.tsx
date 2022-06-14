import { Colors, Shadows, Spacing, Typography } from '../../styles'
import React, { useEffect, useMemo } from 'react'
import { TEmailThread } from '../../utils/types'
import { icons, logos } from '../../styles/images'

import { Icon } from '../atoms/Icon'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import styled from 'styled-components'
import toast from '../../utils/toast'
import { useCreateTaskFromThread, useModifyThread } from '../../services/api-query-hooks'
import { useNavigate } from 'react-router-dom'
import { EmailList } from './email/EmailList'
import TooltipWrapper from '../atoms/TooltipWrapper'
import ReactTooltip from 'react-tooltip'

const THREAD_HEADER_HEIGHT = '118px'
const MARK_AS_READ = 'Mark as Read'
const MARK_AS_UNREAD = 'Mark as Unread'

const FlexColumnContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 300px;
`
const HeaderContainer = styled.div`
    display: flex;
    height: ${THREAD_HEADER_HEIGHT};
    padding: 0 ${Spacing.padding._16};
    align-items: center;
    background-color: ${Colors.white};
    position: sticky;
    gap: ${Spacing.margin._8};
    box-shadow: ${Shadows.threadHeaderShadow};
`
const HeaderTitleContainer = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
`
const Title = styled.span`
    margin-left: ${Spacing.margin._8};
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

interface ThreadDetailsProps {
    thread: TEmailThread
}
const ThreadDetails = ({ thread }: ThreadDetailsProps) => {
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
    }

    return (
        <FlexColumnContainer>
            <HeaderContainer>
                <Icon size="medium" source={logos.gmail} />
                <HeaderTitleContainer>
                    <Title>{title}</Title>
                    <SubTitle>{`To: ${recipient_emails.join(', ')}`}</SubTitle>
                </HeaderTitleContainer>
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
            </HeaderContainer>
            <EmailList thread={thread} />
        </FlexColumnContainer>
    )
}

export default ThreadDetails
