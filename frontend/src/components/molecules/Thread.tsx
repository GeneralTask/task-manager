import React, { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import { useAppSelector } from '../../redux/hooks'
import { Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TEmailThread } from '../../utils/types'
import MarkAsTaskButton from '../atoms/buttons/MarkAsTaskButton'
import { Icon } from '../atoms/Icon'
import ItemContainer from './ItemContainer'


const IconContainer = styled.div`
    margin-left: ${Spacing.margin._8}px;
`
const Title = styled.span`
    margin-left: ${Spacing.margin._8}px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: Switzer-Variable;
    font-size: ${Typography.xSmall.fontSize};
`
interface ThreadProps {
    thread: TEmailThread
}
const Thread = ({ thread }: ThreadProps) => {
    const navigate = useNavigate()
    const params = useParams()
    const isExpanded = params.thread === thread.id
    const isSelected = useAppSelector((state) => isExpanded || state.tasks_page.selected_item_id === thread.id)

    const hideDetailsView = useCallback(() => navigate(`/messages/`), [])

    const onClickHandler = useCallback(() => {
        if (params.thread === thread.id) hideDetailsView()
        else navigate(`/messages/${thread.id}`)
    }, [params, thread])

    useKeyboardShortcut(KEYBOARD_SHORTCUTS.CLOSE, hideDetailsView, !isExpanded)
    useKeyboardShortcut(KEYBOARD_SHORTCUTS.SELECT, onClickHandler, !isSelected)

    return (
        <ItemContainer isSelected={isSelected} onClick={onClickHandler} >
            <MarkAsTaskButton isTask={thread.is_task} messageId={thread.id} />
            <IconContainer>
                <Icon source={logos[thread.source.logo_v2]} size="small" />
            </IconContainer>
            <Title>{thread.emails[0]?.subject}</Title>
        </ItemContainer>
    )
}

export default Thread
