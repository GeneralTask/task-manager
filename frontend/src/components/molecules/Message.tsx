import React, { useCallback } from 'react'
import { Spacing, Typography } from '../../styles'
import { useNavigate, useParams } from 'react-router-dom'

import { Icon } from '../atoms/Icon'
import ItemContainer from './ItemContainer'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import MarkAsTaskButton from '../atoms/buttons/MarkAsTaskButton'
import { TMessage } from '../../utils/types'
import { logos } from '../../styles/images'
import styled from 'styled-components'
import { useAppSelector } from '../../redux/hooks'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'

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
interface MessageProps {
    message: TMessage
}
const Message = ({ message }: MessageProps) => {
    const navigate = useNavigate()
    const params = useParams()
    const isExpanded = params.message === message.id
    const isSelected = useAppSelector((state) => isExpanded || state.tasks_page.selected_item_id === message.id)

    const hideDetailsView = useCallback(() => navigate(`/messages/`), [])

    const onClickHandler = useCallback(() => {
        if (params.message === message.id) hideDetailsView()
        else navigate(`/messages/${message.id}`)
    }, [params, message])

    useKeyboardShortcut(KEYBOARD_SHORTCUTS.CLOSE, hideDetailsView, !isExpanded)
    useKeyboardShortcut(KEYBOARD_SHORTCUTS.SELECT, onClickHandler, !isSelected)

    return (
        <ItemContainer isSelected={isSelected} onClick={onClickHandler}>
            <MarkAsTaskButton isTask={message.is_task} messageId={message.id} />
            <IconContainer>
                <Icon source={logos[message.source.logo_v2]} size="small" />
            </IconContainer>
            <Title>{message.title}</Title>
        </ItemContainer>
    )
}

export default Message
