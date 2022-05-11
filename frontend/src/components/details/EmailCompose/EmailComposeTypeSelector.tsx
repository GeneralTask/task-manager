import React, { useRef, useState } from 'react'
import { icons } from '../../../styles/images'
import { EmailComposeType } from '../../../utils/enums'
import { TEmail, TEmailComposeState } from '../../../utils/types'
import { Icon } from '../../atoms/Icon'
import GTSelect from '../../molecules/GTSelect'
import { EmailActionOption, EmailComposeIconButton, NoWrap } from './EmailCompose-styles'

interface EmailComposeTypeSelectorProps {
    email: TEmail
    setThreadComposeState: React.Dispatch<React.SetStateAction<TEmailComposeState>>
    isNewEmail: boolean
    // if isNewEmail, appears as ellipsis button in thread. If false, appears as caret_down in compose form with smaller options
}
const EmailComposeTypeSelector = ({ email, isNewEmail, setThreadComposeState }: EmailComposeTypeSelectorProps) => {
    const [showEmailActions, setShowEmailActions] = useState(false)
    const emailActionsRef = useRef<HTMLDivElement>(null)

    const handleEmailActionsButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        setShowEmailActions((show) => !show)
    }

    const replyOption = {
        item: (
            <EmailActionOption>
                {isNewEmail && <Icon size="medium" source={icons.reply} />}
                <NoWrap>Reply</NoWrap>
            </EmailActionOption>
        ),
        onClick: () => {
            setThreadComposeState({
                emailComposeType: EmailComposeType.REPLY,
                emailId: email.message_id,
            })
        },
    }
    const replyAllOption = {
        item: (
            <EmailActionOption>
                {isNewEmail && <Icon size="medium" source={icons.replyAll} />}
                <NoWrap>Reply All</NoWrap>
            </EmailActionOption>
        ),
        onClick: () => {
            setThreadComposeState({
                emailComposeType: EmailComposeType.REPLY_ALL,
                emailId: email.message_id,
            })
        },
    }
    const forwardOption = {
        item: (
            <EmailActionOption>
                {isNewEmail && <Icon size="medium" source={icons.forward} />}
                <NoWrap>Forward</NoWrap>
            </EmailActionOption>
        ),
        onClick: () => {
            setThreadComposeState({
                emailComposeType: EmailComposeType.FORWARD,
                emailId: email.message_id,
            })
        },
    }

    const emailActionOptions = [replyOption, forwardOption]
    const numRecipients = email.recipients.to.length + email.recipients.cc.length
    if (numRecipients > 1) {
        emailActionOptions.splice(1, 0, replyAllOption)
    }

    return (
        <div ref={emailActionsRef}>
            <EmailComposeIconButton onClick={handleEmailActionsButtonClick} hasBorder={!isNewEmail}>
                <Icon
                    size={isNewEmail ? 'small' : 'xxSmall'}
                    source={isNewEmail ? icons.skinnyHamburger : icons.caret_down}
                />
            </EmailComposeIconButton>
            {showEmailActions && (
                <GTSelect
                    options={emailActionOptions}
                    location="right"
                    onClose={() => setShowEmailActions(false)}
                    parentRef={emailActionsRef}
                />
            )}
        </div>
    )
}

export default EmailComposeTypeSelector
