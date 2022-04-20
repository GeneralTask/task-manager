import { DateTime } from 'luxon'
import React, { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import { useAppSelector } from '../../redux/hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TEmailThread } from '../../utils/types'
import { removeHTMLTags, timeSince } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import ItemContainer from './ItemContainer'

const IconContainer = styled.div`
    margin-left: ${Spacing.margin._8}px;
`
const TitleContainer = styled.div`
    display: flex;
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
`
const BodyPreview = styled(SubTitle)`
    color: ${Colors.gray._400};
`
const SentAt = styled.span`
    margin-left: auto;
    font-family: Switzer-Variable;
    font-size: ${Typography.small.fontSize};
    color: ${Colors.gray._400};
    min-width: fit-content;
`
const FlexGrowSpacer = styled.div`
    display: flex;
    flex-grow: 1;
`
interface ThreadProps {
    thread: TEmailThread
}
const Thread = ({ thread }: ThreadProps) => {
    const navigate = useNavigate()
    const params = useParams()
    const isExpanded = params.thread === thread.id
    const isSelected = useAppSelector((state) => isExpanded || state.tasks_page.selected_item_id === thread.id)

    const onClickHandler = useCallback(() => {
        navigate(`/messages/${thread.id}`)
    }, [params, thread])

    useKeyboardShortcut(KEYBOARD_SHORTCUTS.SELECT, onClickHandler, !isSelected)

    const senders = thread.emails[0]?.sender.name
    const title = `${thread.emails[0]?.subject} (${thread.emails.length})`
    const bodyDirtyHTML = thread.emails[0]?.body
    const sentAt = timeSince(DateTime.fromISO(thread.emails[thread.emails.length - 1]?.sent_at))

    return (
        <ItemContainer isSelected={isSelected} onClick={onClickHandler}>
            <IconContainer>
                <Icon source={logos[thread.source.logo_v2]} size="small" />
            </IconContainer>
            <TitleContainer>
                <Title>{senders}</Title>
                <SubTitle>{title}</SubTitle>
                <BodyPreview>{removeHTMLTags(bodyDirtyHTML)}</BodyPreview>
            </TitleContainer>
            <FlexGrowSpacer />
            <SentAt>{sentAt}</SentAt>
        </ItemContainer>
    )
}

export default Thread
