import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { Spacing, Border, Colors } from '../../../styles'
import { icons } from '../../../styles/images'
import { EmailComposeType } from '../../../utils/enums'
import { TEmail, TEmailComposeState } from '../../../utils/types'
import NoStyleButton from '../../atoms/buttons/NoStyleButton'
import { Icon } from '../../atoms/Icon'
import GTSelect from '../../molecules/GTSelect'

const EmailActionContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing.padding._8}px;
`
const IconButton = styled(NoStyleButton)<{ hasBorder: boolean }>`
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid ${(props) => (props.hasBorder ? Colors.gray._200 : 'transparent')};
    border-radius: ${Border.radius.xxSmall};
    position: relative;
    padding: ${Spacing.padding._4}px;
    min-height: 20px;
    min-width: 20px;
    &:hover {
        background-color: ${Colors.gray._200};
    }
`

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

    const optionIconSize = isNewEmail ? 'medium' : 'small'

    const emailActionOptions = [
        {
            item: (
                <EmailActionContainer>
                    <Icon size={optionIconSize} source={icons.reply} />
                    Reply
                </EmailActionContainer>
            ),
            onClick: () => {
                setThreadComposeState({
                    emailComposeType: EmailComposeType.REPLY,
                    emailId: email.message_id,
                })
            },
        },
        {
            item: (
                <EmailActionContainer>
                    <Icon size={optionIconSize} source={icons.replyAll} />
                    Reply All
                </EmailActionContainer>
            ),
            onClick: () => {
                setThreadComposeState({
                    emailComposeType: EmailComposeType.REPLY_ALL,
                    emailId: email.message_id,
                })
            },
        },
        {
            item: (
                <EmailActionContainer>
                    <Icon size={optionIconSize} source={icons.forward} />
                    Forward
                </EmailActionContainer>
            ),
            onClick: () => {
                setThreadComposeState({
                    emailComposeType: EmailComposeType.FORWARD,
                    emailId: email.message_id,
                })
            },
        },
    ]

    return (
        <div ref={emailActionsRef}>
            <IconButton onClick={handleEmailActionsButtonClick} hasBorder={!isNewEmail}>
                <Icon
                    size={isNewEmail ? 'small' : 'xxSmall'}
                    source={isNewEmail ? icons.skinnyHamburger : icons.caret_down}
                />
            </IconButton>
            {showEmailActions && (
                <GTSelect
                    options={emailActionOptions}
                    onClose={() => setShowEmailActions(false)}
                    parentRef={emailActionsRef}
                />
            )}
        </div>
    )
}

export default EmailComposeTypeSelector
