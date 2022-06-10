import { KEYBOARD_SHORTCUTS } from '../../../../constants'
import { useKeyboardShortcut } from '../../../../hooks'
import { Images } from '../../../../styles'
import { EmailComposeType } from '../../../../utils/enums'
import { TEmail, TEmailComposeState } from '../../../../utils/types'
import { Icon } from '../../../atoms/Icon'
import { EmailActionButton, EmailActionButtonContainer, Flex } from './styles'
import React from 'react'

interface EmailMainActionsProps {
    email: TEmail
    setThreadComposeState: (state: TEmailComposeState) => void
}
const EmailMainActions = ({ email, setThreadComposeState }: EmailMainActionsProps) => {
    const onReply = () => {
        setThreadComposeState({
            emailComposeType: EmailComposeType.REPLY,
            emailId: email.message_id,
        })
    }
    const onReplyAll = () => {
        setThreadComposeState({
            emailComposeType: EmailComposeType.REPLY_ALL,
            emailId: email.message_id,
        })
    }
    const onForward = () => {
        setThreadComposeState({
            emailComposeType: EmailComposeType.FORWARD,
            emailId: email.message_id,
        })
    }
    useKeyboardShortcut(KEYBOARD_SHORTCUTS.REPLY, onReply)
    useKeyboardShortcut(KEYBOARD_SHORTCUTS.REPLY_ALL, onReplyAll)
    useKeyboardShortcut(KEYBOARD_SHORTCUTS.FORWARD, onForward)

    return (
        <Flex>
            <EmailActionButtonContainer>
                <EmailActionButton onClick={onReply}>
                    <Icon size="medium" source={Images.icons.reply} />
                </EmailActionButton>
            </EmailActionButtonContainer>
            <EmailActionButtonContainer>
                <EmailActionButton onClick={onReplyAll}>
                    <Icon size="medium" source={Images.icons.replyAll} />
                </EmailActionButton>
            </EmailActionButtonContainer>
            <EmailActionButtonContainer>
                <EmailActionButton onClick={onForward}>
                    <Icon size="medium" source={Images.icons.forward} />
                </EmailActionButton>
            </EmailActionButtonContainer>
        </Flex>
    )
}

export default React.memo(EmailMainActions)
