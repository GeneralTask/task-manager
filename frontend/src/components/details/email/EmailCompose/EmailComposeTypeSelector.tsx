import { EmailActionOption, EmailComposeIconButton, NoWrap } from './EmailCompose-styles'
import React, { useCallback, useRef, useState } from 'react'
import { TEmail, TEmailComposeState } from '../../../../utils/types'

import { EmailComposeType } from '../../../../utils/enums'
import GTSelect from '../../../molecules/GTSelect'
import { Icon } from '../../../atoms/Icon'
import { icons } from '../../../../styles/images'

interface EmailComposeTypeSelectorProps {
    email: TEmail
    setThreadComposeState: React.Dispatch<React.SetStateAction<TEmailComposeState>>
    // if isNewEmail, appears as ellipsis button in thread. If false, appears as caret_down in compose form with smaller options
    isNewEmail?: boolean
}
const EmailComposeTypeSelector = ({ email, isNewEmail, setThreadComposeState }: EmailComposeTypeSelectorProps) => {
    isNewEmail = isNewEmail ?? false
    const [showEmailActions, setShowEmailActions] = useState(false)
    const emailActionsRef = useRef<HTMLDivElement>(null)

    const handleEmailActionsButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        setShowEmailActions((show) => !show)
    }

    const getComposeOption = useCallback(
        (type: EmailComposeType) => {
            let icon = icons.reply
            let label = 'Reply'
            if (type === EmailComposeType.REPLY_ALL) {
                icon = icons.replyAll
                label = 'Reply All'
            } else if (type === EmailComposeType.FORWARD) {
                icon = icons.forward
                label = 'Forward'
            }
            return {
                item: (
                    <EmailActionOption>
                        {isNewEmail && <Icon size="medium" source={icon} />}
                        <NoWrap>{label}</NoWrap>
                    </EmailActionOption>
                ),
                onClick: () => {
                    setThreadComposeState({
                        emailComposeType: type,
                        emailId: email.message_id,
                    })
                },
            }
        },
        [isNewEmail, setThreadComposeState]
    )

    const emailActionOptions = [getComposeOption(EmailComposeType.REPLY), getComposeOption(EmailComposeType.FORWARD)]
    if (email.recipients.to.length + email.recipients.cc.length > 1) {
        emailActionOptions.splice(1, 0, getComposeOption(EmailComposeType.REPLY_ALL))
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
                    location={isNewEmail ? 'left' : 'right'}
                    onClose={() => setShowEmailActions(false)}
                    parentRef={emailActionsRef}
                />
            )}
        </div>
    )
}

export default React.memo(EmailComposeTypeSelector)
